from pathlib import Path

import pandas as pd


def run_ocr_stage(dataframe: pd.DataFrame) -> pd.DataFrame:
    records: list[dict[str, str]] = []

    for _, row in dataframe.iterrows():
        extracted_text = str(row.get("ocr_text") or row.get("text") or "").strip()
        document_path = str(row.get("document_path") or row.get("image_path") or "").strip()

        if not extracted_text and document_path:
            source_path = Path(document_path)
            extracted_text = (
                f"[OCR placeholder] Texte a extraire depuis {source_path.name}. "
                "Branchez ici Tesseract, EasyOCR ou PaddleOCR."
            )

        if not extracted_text:
            extracted_text = "[OCR placeholder] Aucun texte source disponible."

        records.append(
            {
                **row.to_dict(),
                "ocr_text": extracted_text,
            }
        )

    return pd.DataFrame(records)
