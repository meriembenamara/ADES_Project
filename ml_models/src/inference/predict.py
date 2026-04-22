import torch
from transformers import CamembertForSequenceClassification, CamembertTokenizerFast

from src.common.io import load_json
from src.config.settings import CAMEMBERT_MODEL_NAME, LABELS_FILE, MAX_SEQUENCE_LENGTH, MODEL_DIR
from src.preprocessing.text_cleaning import normalize_text


def predict_document(text: str) -> dict[str, str | float]:
    if not MODEL_DIR.exists():
        raise FileNotFoundError("Aucun modele entraine disponible. Lancez /train d'abord.")

    cleaned_text = normalize_text(text)

    if not cleaned_text:
        raise ValueError("Le texte a predire est vide.")

    labels_payload = load_json(LABELS_FILE) if LABELS_FILE.exists() else {"labels": []}
    tokenizer = CamembertTokenizerFast.from_pretrained(str(MODEL_DIR) if MODEL_DIR.exists() else CAMEMBERT_MODEL_NAME)
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
        "predicted_label": str(predicted_label),
        "confidence": float(round(probabilities[best_index].item(), 4)),
    }
