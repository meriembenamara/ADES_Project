from pathlib import Path

import pandas as pd
import requests


def _has_text_source(dataframe: pd.DataFrame) -> bool:
    text_columns = {"text", "ocr_text", "document_path", "image_path"}
    return bool(text_columns.intersection(dataframe.columns))


def _fill_missing_text_columns(dataframe: pd.DataFrame) -> pd.DataFrame:
    for column in ["ocr_text", "text", "document_path", "image_path"]:
        if column in dataframe.columns:
            dataframe[column] = dataframe[column].fillna("")
        else:
            dataframe[column] = ""
    return dataframe


def validate_classification_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
    if "label" not in dataframe.columns:
        raise ValueError("Le dataset doit contenir au minimum la colonne 'label'.")

    if not _has_text_source(dataframe):
        raise ValueError(
            "Le dataset doit contenir au moins une source de contenu parmi 'text', 'ocr_text', 'document_path', 'image_path'."
        )

    if dataframe.empty:
        raise ValueError("Le dataset est vide.")

    dataframe = _fill_missing_text_columns(dataframe)

    base_columns = [
        column
        for column in [
            "document_id",
            "document_path",
            "image_path",
            "text",
            "ocr_text",
            "label",
            "class_key",
            "category_key",
            "attribute_name",
            "attribute_snippet",
            "attribute_value",
        ]
        if column in dataframe.columns
    ]

    return dataframe[base_columns].dropna(subset=["label"])


def validate_extraction_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
    required_columns = {"attribute_name", "attribute_value"}
    if not required_columns.issubset(dataframe.columns):
        raise ValueError(
            "Le dataset d'extraction doit contenir 'attribute_name' et 'attribute_value'."
        )

    if not _has_text_source(dataframe):
        raise ValueError(
            "Le dataset d'extraction doit contenir au moins une source de contenu parmi 'text', 'ocr_text', 'document_path', 'image_path'."
        )

    if dataframe.empty:
        raise ValueError("Le dataset est vide.")

    dataframe = _fill_missing_text_columns(dataframe)

    base_columns = [
        column
        for column in [
            "document_id",
            "document_path",
            "image_path",
            "text",
            "ocr_text",
            "label",
            "class_key",
            "category_key",
            "attribute_name",
            "attribute_snippet",
            "attribute_value",
        ]
        if column in dataframe.columns
    ]

    return (
        dataframe[base_columns]
        .dropna(subset=["attribute_name", "attribute_value"])
        .assign(
            attribute_name=lambda df: df["attribute_name"].astype(str).str.strip(),
            attribute_value=lambda df: df["attribute_value"].astype(str).str.strip(),
        )
        .query("attribute_name != '' and attribute_value != ''")
        .reset_index(drop=True)
    )


def validate_training_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
    if {"attribute_name", "attribute_value"}.issubset(dataframe.columns):
        return validate_extraction_dataframe(dataframe)

    return validate_classification_dataframe(dataframe)


def load_training_dataset(dataset_path: Path) -> pd.DataFrame:
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset introuvable: {dataset_path}")

    dataframe = pd.read_csv(dataset_path)
    return validate_training_dataframe(dataframe)


def load_training_dataset_from_backend(api_url: str, token: str | None = None) -> pd.DataFrame:
    headers = {"Accept": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    response = requests.get(api_url, headers=headers, timeout=30)
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items", [])

    dataframe = pd.DataFrame(items)

    if dataframe.empty:
        raise ValueError("Aucune annotation exploitable n'a ete recuperee depuis le backend.")

    return validate_training_dataframe(dataframe)
