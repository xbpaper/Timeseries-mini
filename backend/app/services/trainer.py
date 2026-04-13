import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
import json
import os
from datetime import datetime
import uuid

class SimpleLSTM(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, output_size: int, num_layers: int = 2):
        super(SimpleLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

class ModelTrainer:
    def __init__(self, model_dir: str = "saved_models"):
        self.model_dir = model_dir
        self.model = None
        self.scaler_mean = None
        self.scaler_std = None
        self.target_column = None
        self.lookback = None
        self.forecast_steps = None
        self.feature_columns = None
        
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
    
    def prepare_data(self, df: pd.DataFrame, target_column: str, lookback: int, forecast_steps: int) -> Tuple[np.ndarray, np.ndarray]:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        if target_column not in numeric_cols:
            raise ValueError(f"目标列 {target_column} 不是数值类型")
        
        self.feature_columns = numeric_cols
        self.target_column = target_column
        self.lookback = lookback
        self.forecast_steps = forecast_steps
        
        data = df[numeric_cols].values
        
        self.scaler_mean = data.mean(axis=0)
        self.scaler_std = data.std(axis=0)
        self.scaler_std[self.scaler_std == 0] = 1
        data_normalized = (data - self.scaler_mean) / self.scaler_std
        
        X, y = [], []
        target_idx = numeric_cols.index(target_column)
        
        for i in range(len(data_normalized) - lookback - forecast_steps + 1):
            X.append(data_normalized[i:i+lookback])
            y.append(data_normalized[i+lookback:i+lookback+forecast_steps, target_idx])
        
        return np.array(X), np.array(y)
    
    def train(self, X: np.ndarray, y: np.ndarray, epochs: int = 50, learning_rate: float = 0.001) -> Tuple[str, float]:
        input_size = X.shape[2]
        hidden_size = 64
        output_size = self.forecast_steps
        
        self.model = SimpleLSTM(input_size, hidden_size, output_size)
        
        X_tensor = torch.FloatTensor(X)
        y_tensor = torch.FloatTensor(y)
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        
        self.model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = self.model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.6f}')
        
        model_id = f"model_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        self.save_model(model_id)
        
        return model_id, loss.item()
    
    def finetune(self, new_X: np.ndarray, new_y: np.ndarray, epochs: int = 10, learning_rate: float = 0.0001) -> float:
        if self.model is None:
            raise ValueError("模型未加载，请先训练或加载模型")
        
        X_tensor = torch.FloatTensor(new_X)
        y_tensor = torch.FloatTensor(new_y)
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        
        self.model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = self.model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
            if (epoch + 1) % 5 == 0:
                print(f'Finetune Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.6f}')
        
        return loss.item()
    
    def predict(self, input_data: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("模型未加载，请先训练或加载模型")
        
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(input_data)
            predictions = self.model(X_tensor)
            return predictions.numpy()
    
    def save_model(self, model_id: str):
        if self.model is None:
            raise ValueError("模型未训练")
        
        model_path = os.path.join(self.model_dir, f"{model_id}.pt")
        config_path = os.path.join(self.model_dir, f"{model_id}_config.json")
        
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'input_size': self.model.lstm.input_size,
            'hidden_size': self.model.hidden_size,
            'output_size': self.model.fc.out_features,
        }, model_path)
        
        config = {
            'scaler_mean': self.scaler_mean.tolist(),
            'scaler_std': self.scaler_std.tolist(),
            'target_column': self.target_column,
            'lookback': self.lookback,
            'forecast_steps': self.forecast_steps,
            'feature_columns': self.feature_columns,
        }
        
        with open(config_path, 'w') as f:
            json.dump(config, f)
    
    def load_model(self, model_id: str):
        model_path = os.path.join(self.model_dir, f"{model_id}.pt")
        config_path = os.path.join(self.model_dir, f"{model_id}_config.json")
        
        if not os.path.exists(model_path) or not os.path.exists(config_path):
            raise ValueError(f"模型 {model_id} 不存在")
        
        checkpoint = torch.load(model_path)
        
        self.model = SimpleLSTM(
            checkpoint['input_size'],
            checkpoint['hidden_size'],
            checkpoint['output_size']
        )
        self.model.load_state_dict(checkpoint['model_state_dict'])
        
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.scaler_mean = np.array(config['scaler_mean'])
        self.scaler_std = np.array(config['scaler_std'])
        self.target_column = config['target_column']
        self.lookback = config['lookback']
        self.forecast_steps = config['forecast_steps']
        self.feature_columns = config['feature_columns']
