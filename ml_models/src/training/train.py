from pathlib import Path
import shutil

import pandas as pd
from sklearn.model_selection import train_test_split
from transformers import (
    CamembertForQuestionAnswering,
    CamembertForSequenceClassification,
    CamembertTokenizerFast,
    Trainer,
    TrainingArguments,
)

from src.augmentation.synthetic_data import run_augmentation_stage
from src.common.io import ensure_directory, save_json
from src.config.settings import (
    ARTIFACTS_DIR,
    CAMEMBERT_MODEL_NAME,
    DEFAULT_DATASET,
    EVAL_BATCH_SIZE,
    FIELDS_FILE,
    FINAL_DATASET_FILE,
    LABELS_FILE,
    LOGS_DIR,
    MAX_SEQUENCE_LENGTH,
    METADATA_FILE,
    MODEL_DIR,
    RAW_DATASET_FILE,
    TRAIN_BATCH_SIZE,
    TRAIN_EPOCHS,
)
from src.evaluation.metrics import compute_classification_metrics
from src.ocr.extract import run_ocr_stage
from src.preprocessing.text_cleaning import normalize_text, run_preprocessing_stage
from src.training.data_loader import load_training_dataset, load_training_dataset_from_backend
from src.training.qa_dataset import QuestionAnsweringDataset
from src.training.transformer_dataset import DocumentClassificationDataset


def _build_document_context(row):
    parts = []
    for key in ["class_key", "category_key"]:
        value = row.get(key)
        if value is not None and not pd.isna(value):
            text_value = str(value).strip()
            if text_value:
                parts.append(text_value)

    text = ""
    for key in ["clean_text", "ocr_text", "text"]:
        value = row.get(key)
        if value is not None and not pd.isna(value):
            text_value = str(value).strip()
            if text_value:
                text = text_value
                break

    if text:
        parts.append(text)

    return " ".join(parts).strip()


def build_compute_metrics(label_names: list[str]):
    def compute_metrics(eval_prediction):
        logits, labels = eval_prediction
        predictions = logits.argmax(axis=-1)
        metrics = compute_classification_metrics(labels, predictions)
        return metrics

    return compute_metrics


def _assert_disk_space(path: Path, min_bytes: int = 600 * 1024**2) -> None:
    available = shutil.disk_usage(path).free
    if available < min_bytes:
        raise RuntimeError(
            f"Espace disque insuffisant pour entainer le modele. "
            f"Libre: {available // (1024**2)} Mo, requis: {min_bytes // (1024**2)} Mo."
        )


def _cleanup_previous_model_artifacts() -> None:
    if not ARTIFACTS_DIR.exists():
        return

    for artifact in ARTIFACTS_DIR.iterdir():
        if artifact.is_dir() and artifact.name.startswith("checkpoint-"):
            shutil.rmtree(artifact, ignore_errors=True)
        elif artifact.name in {"pytorch_model.bin", "model.safetensors"}:
            try:
                artifact.unlink()
            except OSError:
                pass
        elif artifact.is_dir() and artifact.name == MODEL_DIR.name:
            shutil.rmtree(artifact, ignore_errors=True)


def _prepare_model_directory() -> None:
    _cleanup_previous_model_artifacts()
    if MODEL_DIR.exists():
        shutil.rmtree(MODEL_DIR)
    _assert_disk_space(MODEL_DIR.parent)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def _is_extraction_dataset(dataframe):
    return {"attribute_name", "attribute_value"}.issubset(dataframe.columns)


def _build_qa_example(question: str, context: str, answer_text: str, tokenizer: CamembertTokenizerFast):
    tokenized = tokenizer(
        question,
        context,
        truncation="only_second",
        max_length=MAX_SEQUENCE_LENGTH,
        padding="max_length",
        return_offsets_mapping=True,
    )

    offsets = tokenized.pop("offset_mapping")
    sequence_ids = tokenized.sequence_ids()
    answer_text = normalize_text(answer_text)
    answer_lower = answer_text.lower()
    answer_start = context.lower().find(answer_lower)

    if answer_start == -1:
        return None

    answer_end = answer_start + len(answer_text)
    start_position = None
    end_position = None

    for index, (offset, sequence_id) in enumerate(zip(offsets, sequence_ids)):
        if sequence_id != 1:
            continue

        if offset[0] <= answer_start < offset[1]:
            start_position = index
        if offset[0] < answer_end <= offset[1]:
            end_position = index

        if start_position is not None and end_position is not None:
            break

    if start_position is None or end_position is None:
        return None

    return tokenized, start_position, end_position


def _prepare_qa_dataset(dataframe, tokenizer: CamembertTokenizerFast):
    encodings: dict[str, list] = {}
    start_positions: list[int] = []
    end_positions: list[int] = []
    field_names: list[str] = []

    for _, row in dataframe.iterrows():
        question = str(row["attribute_name"]).strip()
        answer_text = str(row["attribute_value"]).strip()

        if not question or not answer_text:
            continue

        context = _build_document_context(row)
        if not context:
            continue

        result = _build_qa_example(question, context, answer_text, tokenizer)
        if result is None:
            continue

        tokenized, start_position, end_position = result

        for key, value in tokenized.items():
            encodings.setdefault(key, []).append(value)

        start_positions.append(start_position)
        end_positions.append(end_position)
        field_names.append(question)

    if not start_positions:
        raise ValueError(
            "Aucune example d'extraction valide n'a pu etre preparee. Verifiez que les valeurs de labels apparaissent dans le texte du document."
        )

    return encodings, start_positions, end_positions, sorted(set(field_names))


def _slice_encodings(encodings: dict[str, list], indices: list[int]) -> dict[str, list]:
    return {key: [values[index] for index in indices] for key, values in encodings.items()}


def _build_qa_metrics():
    def compute_metrics(eval_prediction):
        start_logits, end_logits = eval_prediction.predictions
        labels = eval_prediction.label_ids

        pred_starts = start_logits.argmax(axis=-1)
        pred_ends = end_logits.argmax(axis=-1)

        exact_matches = (pred_starts == labels[:, 0]) & (pred_ends == labels[:, 1])
        start_accuracy = float(round((pred_starts == labels[:, 0]).astype(float).mean(), 4))
        end_accuracy = float(round((pred_ends == labels[:, 1]).astype(float).mean(), 4))
        exact_match = float(round(exact_matches.astype(float).mean(), 4))

        return {
            "start_accuracy": start_accuracy,
            "end_accuracy": end_accuracy,
            "exact_match": exact_match,
        }

    return compute_metrics


def _train_extraction_model(
    raw_dataframe,
    dataset_origin: str,
    data_source: str,
) -> dict[str, str | int | float]:
    tokenizer = CamembertTokenizerFast.from_pretrained(CAMEMBERT_MODEL_NAME)
    encodings, start_positions, end_positions, field_names = _prepare_qa_dataset(raw_dataframe, tokenizer)

    example_indices = list(range(len(start_positions)))
    train_indices, test_indices = train_test_split(
        example_indices,
        test_size=0.3,
        random_state=42,
        stratify=[field_names[index] for index in example_indices],
    )

    train_encodings = _slice_encodings(encodings, train_indices)
    test_encodings = _slice_encodings(encodings, test_indices)
    train_start_positions = [start_positions[index] for index in train_indices]
    train_end_positions = [end_positions[index] for index in train_indices]
    test_start_positions = [start_positions[index] for index in test_indices]
    test_end_positions = [end_positions[index] for index in test_indices]

    train_dataset = QuestionAnsweringDataset(train_encodings, train_start_positions, train_end_positions)
    test_dataset = QuestionAnsweringDataset(test_encodings, test_start_positions, test_end_positions)

    model = CamembertForQuestionAnswering.from_pretrained(CAMEMBERT_MODEL_NAME)

    ensure_directory(ARTIFACTS_DIR)
    ensure_directory(LOGS_DIR)
    _prepare_model_directory()

    raw_dataframe.to_csv(RAW_DATASET_FILE, index=False)
    raw_dataframe.to_csv(FINAL_DATASET_FILE, index=False)

    training_args = TrainingArguments(
        output_dir=str(MODEL_DIR),
        overwrite_output_dir=True,
        eval_strategy="epoch",
        save_strategy="no",
        logging_strategy="epoch",
        save_safetensors=False,
        load_best_model_at_end=False,
        per_device_train_batch_size=TRAIN_BATCH_SIZE,
        per_device_eval_batch_size=EVAL_BATCH_SIZE,
        num_train_epochs=TRAIN_EPOCHS,
        report_to="none",
        logging_dir=str(LOGS_DIR / "trainer"),
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        tokenizer=tokenizer,
        compute_metrics=_build_qa_metrics(),
    )

    trainer.train()
    evaluation_output = trainer.predict(test_dataset)
    metrics = _build_qa_metrics()(evaluation_output)

    try:
        trainer.save_model(str(MODEL_DIR))
        tokenizer.save_pretrained(str(MODEL_DIR))
    except (OSError, RuntimeError) as exc:
        raise RuntimeError(
            f"Impossible d'enregistrer le modele dans {MODEL_DIR}. Verifiez l'espace disque et les permissions."
        ) from exc

    save_json(FIELDS_FILE, {"fields": field_names})
    save_json(
        METADATA_FILE,
        {
            "dataset_path": dataset_origin,
            "data_source": data_source,
            "model_type": "question_answering",
            "field_labels": field_names,
            "pipeline_steps": [
                "documents",
                "labeling_human_in_loop",
                "ocr",
                "preprocessing",
                "data_augmentation",
                "final_dataset",
                "question_answering_training",
                "evaluation",
            ],
            "samples_count": int(len(start_positions)),
            "real_samples_count": int(len(raw_dataframe)),
            "labels_count": int(len(field_names)),
            "fields_count": int(len(field_names)),
            "model_path": str(MODEL_DIR),
            "model_family": "camembert_for_question_answering",
            "target_model_family": "camembert",
            "metrics": metrics,
        },
    )

    return {
        "message": "Modele d'extraction entraine avec succes.",
        "dataset_path": dataset_origin,
        "model_type": "question_answering",
        "labels_count": int(len(field_names)),
        "fields_count": int(len(field_names)),
        "samples_count": int(len(start_positions)),
        "model_path": str(MODEL_DIR),
        "accuracy": metrics["exact_match"],
        "precision": metrics["start_accuracy"],
        "recall": metrics["end_accuracy"],
        "f1_score": metrics["exact_match"],
    }


def _train_classification_model(
    processed_dataframe,
    dataset_origin: str,
    data_source: str,
) -> dict[str, str | int | float]:
    final_dataset = run_augmentation_stage(processed_dataframe)

    if final_dataset.empty:
        raise ValueError("Le dataset final est vide apres preprocessing et augmentation.")

    final_dataset = final_dataset.drop_duplicates(subset=["clean_text", "label"]).reset_index(drop=True)

    train_set, test_set = train_test_split(
        final_dataset[["clean_text", "label"]],
        test_size=0.3,
        random_state=42,
        stratify=final_dataset["label"],
    )

    label_names = sorted(final_dataset["label"].unique().tolist())
    label_to_id = {label: index for index, label in enumerate(label_names)}
    id_to_label = {index: label for label, index in label_to_id.items()}

    train_labels = train_set["label"].map(label_to_id).tolist()
    test_labels = test_set["label"].map(label_to_id).tolist()

    tokenizer = CamembertTokenizerFast.from_pretrained(CAMEMBERT_MODEL_NAME)
    model = CamembertForSequenceClassification.from_pretrained(
        CAMEMBERT_MODEL_NAME,
        num_labels=len(label_names),
        id2label=id_to_label,
        label2id=label_to_id,
    )

    train_encodings = tokenizer(
        train_set["clean_text"].tolist(),
        truncation=True,
        padding=True,
        max_length=MAX_SEQUENCE_LENGTH,
    )
    test_encodings = tokenizer(
        test_set["clean_text"].tolist(),
        truncation=True,
        padding=True,
        max_length=MAX_SEQUENCE_LENGTH,
    )

    train_dataset = DocumentClassificationDataset(train_encodings, train_labels)
    test_dataset = DocumentClassificationDataset(test_encodings, test_labels)

    ensure_directory(ARTIFACTS_DIR)
    ensure_directory(LOGS_DIR)
    _prepare_model_directory()

    processed_dataframe.to_csv(FINAL_DATASET_FILE, index=False)

    training_args = TrainingArguments(
        output_dir=str(MODEL_DIR),
        overwrite_output_dir=True,
        eval_strategy="epoch",
        save_strategy="no",
        logging_strategy="epoch",
        save_safetensors=False,
        load_best_model_at_end=False,
        per_device_train_batch_size=TRAIN_BATCH_SIZE,
        per_device_eval_batch_size=EVAL_BATCH_SIZE,
        num_train_epochs=TRAIN_EPOCHS,
        report_to="none",
        logging_dir=str(LOGS_DIR / "trainer"),
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        tokenizer=tokenizer,
        compute_metrics=build_compute_metrics(label_names),
    )

    trainer.train()
    evaluation_output = trainer.predict(test_dataset)
    metrics = compute_classification_metrics(test_labels, evaluation_output.predictions.argmax(axis=-1))

    try:
        trainer.save_model(str(MODEL_DIR))
        tokenizer.save_pretrained(str(MODEL_DIR))
    except (OSError, RuntimeError) as exc:
        raise RuntimeError(
            f"Impossible d'enregistrer le modele dans {MODEL_DIR}. Verifiez l'espace disque et les permissions."
        ) from exc

    save_json(
        LABELS_FILE,
        {
            "labels": label_names,
            "label_to_id": label_to_id,
        },
    )
    save_json(
        METADATA_FILE,
        {
            "dataset_path": dataset_origin,
            "data_source": data_source,
            "model_type": "classification",
            "pipeline_steps": [
                "documents",
                "labeling_human_in_loop",
                "ocr",
                "preprocessing",
                "synthetic_generation",
                "data_augmentation",
                "final_dataset",
                "feature_engineering",
                "model_training",
                "evaluation",
            ],
            "samples_count": int(len(final_dataset)),
            "real_samples_count": int(len(processed_dataframe)),
            "synthetic_samples_count": int(max(len(final_dataset) - len(processed_dataframe), 0)),
            "labels_count": int(final_dataset["label"].nunique()),
            "model_path": str(MODEL_DIR),
            "model_family": "camembert_for_sequence_classification",
            "target_model_family": "camembert",
            "metrics": metrics,
        },
    )

    return {
        "message": "Modele de classification entraine avec succes.",
        "dataset_path": dataset_origin,
        "model_type": "classification",
        "labels_count": int(final_dataset["label"].nunique()),
        "samples_count": int(len(final_dataset)),
        "model_path": str(MODEL_DIR),
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "f1_score": metrics["f1_score"],
    }


def train_model(
    dataset_path: str | None = None,
    data_source: str = "csv",
    backend_api_url: str | None = None,
    backend_token: str | None = None,
) -> dict[str, str | int | float]:
    resolved_dataset = Path(dataset_path) if dataset_path else DEFAULT_DATASET

    if data_source == "backend":
        if not backend_api_url:
            raise ValueError("backend_api_url est obligatoire quand data_source vaut 'backend'.")
        raw_dataframe = load_training_dataset_from_backend(backend_api_url, backend_token)
        dataset_origin = backend_api_url
    else:
        raw_dataframe = load_training_dataset(resolved_dataset)
        dataset_origin = str(resolved_dataset)

    ocr_dataframe = run_ocr_stage(raw_dataframe)
    preprocessed_dataframe = run_preprocessing_stage(ocr_dataframe)

    if _is_extraction_dataset(raw_dataframe):
        return _train_extraction_model(preprocessed_dataframe, dataset_origin, data_source)

    return _train_classification_model(preprocessed_dataframe, dataset_origin, data_source)
