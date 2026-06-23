import re
import unicodedata

import pandas as pd


def normalize_text(value: str) -> str:
    text = str(value or "")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def run_preprocessing_stage(dataframe: pd.DataFrame) -> pd.DataFrame:
    processed = dataframe.copy()
    processed["ocr_text"] = processed.get("ocr_text", pd.Series(dtype="string")).fillna("").astype(str)
    processed["text"] = processed.get("text", pd.Series(dtype="string")).fillna("").astype(str)
    processed["content_source"] = processed["ocr_text"].where(processed["ocr_text"].str.strip() != "", processed["text"])
    processed["clean_text"] = processed["content_source"].map(normalize_text)
    return processed
