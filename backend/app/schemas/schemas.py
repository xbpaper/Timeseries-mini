from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class UploadResponse(BaseModel):
    columns: List[str]
    rows: int
    preview: List[Dict[str, Any]]

class CleanRequest(BaseModel):
    missing_strategy: str = "ffill"
    outlier_method: str = "3sigma"
    resample_freq: Optional[str] = None
    selected_columns: Optional[List[str]] = None

class CleanResponse(BaseModel):
    cleaned_rows: int
    data: List[Dict[str, Any]]

class TrainRequest(BaseModel):
    target_column: str
    lookback: int = 24
    forecast_steps: int = 6
    epochs: int = 50
    learning_rate: float = 0.001

class TrainResponse(BaseModel):
    model_id: str
    train_loss: float
    status: str

class FinetuneRequest(BaseModel):
    model_id: str
    new_data: List[Dict[str, Any]]
    epochs: int = 10

class FinetuneResponse(BaseModel):
    finetune_loss: float
    status: str

class PredictRequest(BaseModel):
    model_id: str
    input_data: List[List[float]]

class PredictResponse(BaseModel):
    predictions: List[List[float]]

class ProgressUpdate(BaseModel):
    epoch: int
    total_epochs: int
    loss: float
    progress: float
