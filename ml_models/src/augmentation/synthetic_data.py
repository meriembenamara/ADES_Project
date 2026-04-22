import pandas as pd


def create_synthetic_examples(dataframe: pd.DataFrame) -> pd.DataFrame:
    synthetic_rows: list[dict[str, str]] = []

    for _, row in dataframe.iterrows():
        clean_text = str(row["clean_text"]).strip()

        if not clean_text:
            continue

        synthetic_rows.append(
            {
                **row.to_dict(),
                "clean_text": f"{clean_text} document {row['label']}",
                "data_origin": "synthetic",
            }
        )
        synthetic_rows.append(
            {
                **row.to_dict(),
                "clean_text": clean_text.replace("date", "date document").replace("montant", "montant total"),
                "data_origin": "synthetic",
            }
        )

    return pd.DataFrame(synthetic_rows)


def run_augmentation_stage(dataframe: pd.DataFrame) -> pd.DataFrame:
    enriched = dataframe.copy()
    enriched["data_origin"] = "real"

    synthetic = create_synthetic_examples(enriched)

    if synthetic.empty:
        return enriched

    return pd.concat([enriched, synthetic], ignore_index=True)
