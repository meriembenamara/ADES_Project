import re

import pandas as pd


def normalize_text(value: str) -> str:
    cleaned = value.lower().strip()
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def run_preprocessing_stage(dataframe: pd.DataFrame) -> pd.DataFrame:
    processed = dataframe.copy()
    processed["clean_text"] = processed["ocr_text"].fillna("").map(normalize_text)
    return processed
