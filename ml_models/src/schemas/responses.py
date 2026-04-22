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


class PredictResponse(BaseModel):
    predicted_label: str
    confidence: float
