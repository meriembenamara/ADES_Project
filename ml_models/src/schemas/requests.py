from pydantic import BaseModel, Field


class TrainRequest(BaseModel):
    dataset_path: str = Field(default="data/documents.csv")
    data_source: str = Field(default="csv")
    backend_api_url: str | None = None
    backend_token: str | None = None


class PredictRequest(BaseModel):
    text: str = Field(min_length=1)
    attribute_names: list[str] | None = None
