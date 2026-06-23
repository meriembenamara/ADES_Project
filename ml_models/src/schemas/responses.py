from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class TrainResponse(BaseModel):
    message: str
    dataset_path: str
    labels_count: int
    samples_count: int
    model_path: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    model_type: str | None = None
    fields_count: int | None = None


class ExtractionPrediction(BaseModel):
    attribute_name: str
    attribute_value: str
    confidence: float


class PredictResponse(BaseModel):
    predictions: list[ExtractionPrediction]
