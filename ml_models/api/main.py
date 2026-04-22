from fastapi import FastAPI, HTTPException

from src.inference.predict import predict_document
from src.schemas.requests import PredictRequest, TrainRequest
from src.schemas.responses import HealthResponse, PredictResponse, TrainResponse
from src.training.train import train_model

app = FastAPI(title="ADES ML Models", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="ml_models")


@app.post("/train", response_model=TrainResponse)
def train(request: TrainRequest) -> TrainResponse:
    try:
        result = train_model(dataset_path=request.dataset_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TrainResponse(**result)


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    try:
        result = predict_document(text=request.text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return PredictResponse(**result)
