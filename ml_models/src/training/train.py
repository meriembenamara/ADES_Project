from pathlib import Path

from sklearn.model_selection import train_test_split
from transformers import CamembertForSequenceClassification, CamembertTokenizerFast, Trainer, TrainingArguments

from src.augmentation.synthetic_data import run_augmentation_stage
from src.common.io import ensure_directory, save_json
from src.config.settings import (
    ARTIFACTS_DIR,
    CAMEMBERT_MODEL_NAME,
    DEFAULT_DATASET,
    EVAL_BATCH_SIZE,
    LABELS_FILE,
    LOGS_DIR,
    MAX_SEQUENCE_LENGTH,
    METADATA_FILE,
    MODEL_DIR,
    TRAIN_BATCH_SIZE,
    TRAIN_EPOCHS,
)
from src.evaluation.metrics import compute_classification_metrics
from src.ocr.extract import run_ocr_stage
from src.preprocessing.text_cleaning import run_preprocessing_stage
from src.training.transformer_dataset import DocumentClassificationDataset
from src.training.data_loader import load_training_dataset


def build_compute_metrics(label_names: list[str]):
    def compute_metrics(eval_prediction):
        logits, labels = eval_prediction
        predictions = logits.argmax(axis=-1)
        metrics = compute_classification_metrics(labels, predictions)
        return metrics

    return compute_metrics


def train_model(dataset_path: str | None = None) -> dict[str, str | int | float]:
    resolved_dataset = Path(dataset_path) if dataset_path else DEFAULT_DATASET
    raw_dataframe = load_training_dataset(resolved_dataset)
    ocr_dataframe = run_ocr_stage(raw_dataframe)
    preprocessed_dataframe = run_preprocessing_stage(ocr_dataframe)
    final_dataset = run_augmentation_stage(preprocessed_dataframe)

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

    training_args = TrainingArguments(
        output_dir=str(MODEL_DIR),
        overwrite_output_dir=True,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="f1_score",
        greater_is_better=True,
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

    trainer.save_model(str(MODEL_DIR))
    tokenizer.save_pretrained(str(MODEL_DIR))
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
            "dataset_path": str(resolved_dataset),
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
            "real_samples_count": int(len(raw_dataframe)),
            "synthetic_samples_count": int(max(len(final_dataset) - len(raw_dataframe), 0)),
            "labels_count": int(final_dataset["label"].nunique()),
            "model_path": str(MODEL_DIR),
            "model_family": "camembert_for_sequence_classification",
            "target_model_family": "camembert",
            "metrics": metrics,
        },
    )

    return {
        "message": "Modele entraine avec succes.",
        "dataset_path": str(resolved_dataset),
        "labels_count": int(final_dataset["label"].nunique()),
        "samples_count": int(len(final_dataset)),
        "model_path": str(MODEL_DIR),
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "f1_score": metrics["f1_score"],
    }
