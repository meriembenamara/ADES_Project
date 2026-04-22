from pydantic import BaseModel, Field


class TrainRequest(BaseModel):
    dataset_path: str = Field(default="data/documents.csv")


class PredictRequest(BaseModel):
    text: str = Field(min_length=1)
