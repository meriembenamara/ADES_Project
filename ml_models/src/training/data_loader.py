from pathlib import Path

import pandas as pd


def load_training_dataset(dataset_path: Path) -> pd.DataFrame:
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset introuvable: {dataset_path}")

    dataframe = pd.read_csv(dataset_path)
    if "label" not in dataframe.columns:
        raise ValueError("Le dataset doit contenir au minimum la colonne 'label'.")

    text_columns = {"text", "ocr_text", "document_path", "image_path"}

    if not text_columns.intersection(dataframe.columns):
        raise ValueError(
            "Le dataset doit contenir au moins une source de contenu parmi 'text', 'ocr_text', 'document_path', 'image_path'."
        )

    if dataframe.empty:
        raise ValueError("Le dataset est vide.")

    base_columns = [column for column in ["document_path", "image_path", "text", "ocr_text", "label"] if column in dataframe.columns]
    return dataframe[base_columns].dropna(subset=["label"])
