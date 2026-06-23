import random

import pandas as pd


def _add_typo(text: str) -> str:
    if len(text) < 5:
        return text

    index = random.randrange(len(text))
    char = text[index]
    if not char.isalpha():
        return text

    replacement = chr(((ord(char.lower()) - 97 + 1) % 26) + 97)
    return text[:index] + replacement + text[index + 1 :]


def _generate_synthetic_variations(clean_text: str, label: str) -> list[str]:
    variations = [f"{clean_text} {label}", clean_text.strip()]

    if "montant" in clean_text:
        variations.append(clean_text.replace("montant", "montant total"))
    if "date" in clean_text:
        variations.append(clean_text.replace("date", "date de facturation"))
    if "facture" in label.lower() or "facture" in clean_text.lower():
        variations.append(f"{clean_text} facture fournisseur")

    if random.random() < 0.4:
        variations.append(_add_typo(clean_text))

    return list(dict.fromkeys([variation.strip() for variation in variations if variation.strip()]))


def create_synthetic_examples(dataframe: pd.DataFrame) -> pd.DataFrame:
    synthetic_rows: list[dict[str, str]] = []

    for _, row in dataframe.iterrows():
        clean_text = str(row["clean_text"]).strip()
        label = str(row["label"]).strip()

        if not clean_text or not label:
            continue

        for variation in _generate_synthetic_variations(clean_text, label):
            if variation == clean_text:
                continue
            synthetic_rows.append(
                {
                    **row.to_dict(),
                    "clean_text": variation,
                    "data_origin": "synthetic",
                }
            )

    return pd.DataFrame(synthetic_rows)


def run_augmentation_stage(dataframe: pd.DataFrame) -> pd.DataFrame:
    enriched = dataframe.copy()
    enriched["data_origin"] = "real"

    synthetic = create_synthetic_examples(enriched)
    final_dataset = pd.concat([enriched, synthetic], ignore_index=True) if not synthetic.empty else enriched
    final_dataset = final_dataset.drop_duplicates(subset=["clean_text", "label"]).reset_index(drop=True)
    return final_dataset
