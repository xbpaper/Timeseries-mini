from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, FileResponse
from ..schemas.schemas import TrainRequest, TrainResponse, FinetuneRequest, FinetuneResponse
from ..services.trainer import ModelTrainer
from ..routers.data import cleaned_data_store
import pandas as pd
import numpy as np
import asyncio
import os

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
        
        # 确保目标列是数值类型
        if trainer.target_column in new_df.columns:
            try:
                new_df[trainer.target_column] = pd.to_numeric(new_df[trainer.target_column], errors='coerce')
            except:
                pass
        
        # 确保所有数值列都是正确的类型
        for col in new_df.columns:
            if col != 'timestamp' and col != 'time' and col != 'date':
                try:
                    new_df[col] = pd.to_numeric(new_df[col], errors='coerce')
                except:
                    pass
        
        # 移除可能的空值
        new_df = new_df.dropna()
        
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

@router.get("/model/{model_id}/fit")
async def get_model_fit(model_id: str):
    try:
        trainer.load_model(model_id)
        
        if 'cleaned_data' not in cleaned_data_store:
            raise HTTPException(status_code=400, detail="请先清洗数据")
        
        df = cleaned_data_store['cleaned_data']
        
        X, y = trainer.prepare_data(
            df,
            trainer.target_column,
            trainer.lookback,
            trainer.forecast_steps
        )
        
        predictions = trainer.predict(X)
        
        target_idx = trainer.feature_columns.index(trainer.target_column)
        y_actual = y * trainer.scaler_std[target_idx] + trainer.scaler_mean[target_idx]
        y_pred = predictions * trainer.scaler_std[target_idx] + trainer.scaler_mean[target_idx]
        
        # 获取时间数据作为横坐标
        timestamps = []
        if 'timestamp' in df.columns:
            # 确保时间戳是字符串格式
            timestamps = df['timestamp'].astype(str).tolist()
            # 只取与预测数据对应的时间戳
            timestamps = timestamps[trainer.lookback:trainer.lookback + len(y_actual.flatten())]
        
        return {
            "actual": y_actual.flatten().tolist(),
            "predicted": y_pred.flatten().tolist(),
            "target_column": trainer.target_column,
            "timestamps": timestamps
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取拟合结果失败: {str(e)}")

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

@router.delete("/model/{model_id}")
async def delete_model(model_id: str):
    try:
        model_dir = "saved_models"
        
        # 删除模型文件
        model_path = os.path.join(model_dir, f"{model_id}.pt")
        config_path = os.path.join(model_dir, f"{model_id}_config.json")
        
        if os.path.exists(model_path):
            os.remove(model_path)
        
        if os.path.exists(config_path):
            os.remove(config_path)
        
        return {"status": "success", "message": f"模型 {model_id} 已删除"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除模型失败: {str(e)}")

@router.get("/model/{model_id}/download")
async def download_model(model_id: str):
    try:
        model_dir = "saved_models"
        model_path = os.path.join(model_dir, f"{model_id}.pt")
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")
        
        return FileResponse(
            path=model_path,
            filename=f"{model_id}.pt",
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载模型失败: {str(e)}")
