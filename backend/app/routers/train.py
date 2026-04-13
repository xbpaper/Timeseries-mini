from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from ..schemas.schemas import TrainRequest, TrainResponse, FinetuneRequest, FinetuneResponse
from ..services.trainer import ModelTrainer
from ..routers.data import cleaned_data_store
import pandas as pd
import numpy as np
import asyncio

router = APIRouter(prefix="/api", tags=["train"])

trainer = ModelTrainer()
active_connections = []

@router.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    try:
        if 'cleaned_data' not in cleaned_data_store:
            raise HTTPException(status_code=400, detail="请先清洗数据")
        
        df = cleaned_data_store['cleaned_data']
        
        X, y = trainer.prepare_data(
            df,
            request.target_column,
            request.lookback,
            request.forecast_steps
        )
        
        model_id, train_loss = trainer.train(
            X, y,
            request.epochs,
            request.learning_rate
        )
        
        return TrainResponse(
            model_id=model_id,
            train_loss=train_loss,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模型训练失败: {str(e)}")

@router.post("/finetune", response_model=FinetuneResponse)
async def finetune_model(request: FinetuneRequest):
    try:
        trainer.load_model(request.model_id)
        
        new_df = pd.DataFrame(request.new_data)
        
        X, y = trainer.prepare_data(
            new_df,
            trainer.target_column,
            trainer.lookback,
            trainer.forecast_steps
        )
        
        finetune_loss = trainer.finetune(X, y, request.epochs)
        
        trainer.save_model(f"{request.model_id}_finetuned")
        
        return FinetuneResponse(
            finetune_loss=finetune_loss,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模型微调失败: {str(e)}")

@router.get("/models")
async def list_models():
    import os
    model_dir = "saved_models"
    
    if not os.path.exists(model_dir):
        return {"models": []}
    
    models = []
    for file in os.listdir(model_dir):
        if file.endswith('.pt'):
            model_id = file[:-3]
            models.append({
                "id": model_id,
                "created": os.path.getmtime(os.path.join(model_dir, file))
            })
    
    return {"models": models}

@router.websocket("/ws/train/{model_id}")
async def websocket_train_progress(websocket: WebSocket, model_id: str):
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"训练进度更新: {data}")
    except WebSocketDisconnect:
        active_connections.remove(websocket)
