from fastapi import APIRouter, HTTPException
from ..schemas.schemas import PredictRequest, PredictResponse
from ..services.trainer import ModelTrainer
import numpy as np

router = APIRouter(prefix="/api", tags=["predict"])

trainer = ModelTrainer()

@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        trainer.load_model(request.model_id)
        
        input_data = np.array(request.input_data)
        
        input_normalized = (input_data - trainer.scaler_mean) / trainer.scaler_std
        
        predictions = trainer.predict(input_normalized)
        
        target_idx = trainer.feature_columns.index(trainer.target_column)
        predictions_denorm = predictions * trainer.scaler_std[target_idx] + trainer.scaler_mean[target_idx]
        
        return PredictResponse(
            predictions=predictions_denorm.tolist()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预测失败: {str(e)}")

@router.get("/agent/{model_id}")
async def get_agent_info(model_id: str):
    try:
        trainer.load_model(model_id)
        
        return {
            "model_id": model_id,
            "target_column": trainer.target_column,
            "lookback": trainer.lookback,
            "forecast_steps": trainer.forecast_steps,
            "feature_columns": trainer.feature_columns,
            "api_endpoint": f"/api/predict",
            "usage": {
                "method": "POST",
                "url": f"/api/predict",
                "body": {
                    "model_id": model_id,
                    "input_data": f"[[... {trainer.lookback} 个时间步的特征数据 ...]]"
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
