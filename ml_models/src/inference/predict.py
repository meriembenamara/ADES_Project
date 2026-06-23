import torch
from transformers import (
    CamembertForQuestionAnswering,
    CamembertForSequenceClassification,
    CamembertTokenizerFast,
)

from src.common.io import load_json
from src.config.settings import (
    CAMEMBERT_MODEL_NAME,
    FIELDS_FILE,
    LABELS_FILE,
    MAX_SEQUENCE_LENGTH,
    MODEL_DIR,
)
from src.preprocessing.text_cleaning import normalize_text


def _extract_answer(
    tokenizer: CamembertTokenizerFast,
    model: CamembertForQuestionAnswering,
    question: str,
    context: str,
) -> tuple[str, float]:
    encoded = tokenizer(
        question,
        context,
        truncation="only_second",
        max_length=MAX_SEQUENCE_LENGTH,
        padding="max_length",
        return_offsets_mapping=True,
        return_tensors="pt",
    )

    inputs = {
        key: value for key, value in encoded.items() if key in {"input_ids", "attention_mask", "token_type_ids"}
    }

    with torch.no_grad():
        outputs = model(**inputs)

    start_logits = outputs.start_logits[0]
    end_logits = outputs.end_logits[0]
    start_index = int(torch.argmax(start_logits).item())
    end_index = int(torch.argmax(end_logits).item())

    sequence_ids = encoded.sequence_ids(0)
    offsets = encoded["offset_mapping"][0].tolist()

    if start_index >= len(sequence_ids) or end_index >= len(sequence_ids):
        return "", 0.0

    if sequence_ids[start_index] != 1 or sequence_ids[end_index] != 1 or end_index < start_index:
        return "", 0.0

    start_offset = offsets[start_index][0]
    end_offset = offsets[end_index][1]
    answer_text = context[start_offset:end_offset].strip()

    start_confidence = float(torch.softmax(start_logits, dim=-1)[start_index].item())
    end_confidence = float(torch.softmax(end_logits, dim=-1)[end_index].item())
    confidence = float(round((start_confidence + end_confidence) / 2, 4))

    return answer_text, confidence


def predict_document(text: str, attribute_names: list[str] | None = None) -> dict[str, list[dict[str, str | float]]]:
    if not MODEL_DIR.exists():
        raise FileNotFoundError("Aucun modele entraine disponible. Lancez /train d'abord.")

    cleaned_text = normalize_text(text)

    if not cleaned_text:
        raise ValueError("Le texte a predire est vide.")

    tokenizer = CamembertTokenizerFast.from_pretrained(str(MODEL_DIR))

    fields_payload = load_json(FIELDS_FILE) if FIELDS_FILE.exists() else {"fields": []}
    field_names = attribute_names or fields_payload.get("fields", [])

    if field_names:
        model = CamembertForQuestionAnswering.from_pretrained(str(MODEL_DIR))
        model.eval()

        predictions = []
        for field_name in field_names:
            field_question = str(field_name).strip()
            if not field_question:
                continue

            answer_text, confidence = _extract_answer(tokenizer, model, field_question, cleaned_text)
            if not answer_text:
                continue

            predictions.append(
                {
                    "attribute_name": field_question,
                    "attribute_value": answer_text,
                    "confidence": confidence,
                }
            )

        return {"predictions": predictions}

    labels_payload = load_json(LABELS_FILE) if LABELS_FILE.exists() else {"labels": []}
    model = CamembertForSequenceClassification.from_pretrained(str(MODEL_DIR))
    model.eval()

    encoded = tokenizer(
        cleaned_text,
        truncation=True,
        padding=True,
        max_length=MAX_SEQUENCE_LENGTH,
        return_tensors="pt",
    )

    with torch.no_grad():
        outputs = model(**encoded)
        probabilities = torch.softmax(outputs.logits, dim=-1)[0]

    best_index = int(torch.argmax(probabilities).item())
    labels = labels_payload.get("labels") or []
    predicted_label = labels[best_index] if best_index < len(labels) else str(best_index)

    return {
        "predictions": [
            {
                "attribute_name": "predicted_label",
                "attribute_value": str(predicted_label),
                "confidence": float(round(probabilities[best_index].item(), 4)),
            }
        ]
    }
