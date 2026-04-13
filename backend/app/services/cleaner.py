import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

class DataCleaner:
    def __init__(self):
        self.df = None
    
    def load_data(self, df: pd.DataFrame):
        self.df = df.copy()
        return self
    
    def handle_missing(self, strategy: str = "ffill") -> 'DataCleaner':
        if self.df is None:
            raise ValueError("请先加载数据")
        
        if strategy == "ffill":
            self.df = self.df.fillna(method="ffill")
        elif strategy == "mean":
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns
            self.df[numeric_cols] = self.df[numeric_cols].fillna(self.df[numeric_cols].mean())
        elif strategy == "drop":
            self.df = self.df.dropna()
        
        return self
    
    def remove_outliers(self, method: str = "3sigma") -> 'DataCleaner':
        if self.df is None:
            raise ValueError("请先加载数据")
        
        if method == "none":
            return self
        
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        if method == "3sigma":
            for col in numeric_cols:
                mean = self.df[col].mean()
                std = self.df[col].std()
                self.df = self.df[(self.df[col] >= mean - 3*std) & (self.df[col] <= mean + 3*std)]
        elif method == "iqr":
            for col in numeric_cols:
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                self.df = self.df[(self.df[col] >= Q1 - 1.5*IQR) & (self.df[col] <= Q3 + 1.5*IQR)]
        
        return self
    
    def resample_data(self, freq: Optional[str] = None) -> 'DataCleaner':
        if self.df is None:
            raise ValueError("请先加载数据")
        
        if freq is None or freq == "none":
            return self
        
        if 'timestamp' in self.df.columns:
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
            self.df = self.df.set_index('timestamp')
            self.df = self.df.resample(freq).mean().reset_index()
        
        return self
    
    def select_columns(self, columns: Optional[List[str]] = None) -> 'DataCleaner':
        if self.df is None:
            raise ValueError("请先加载数据")
        
        if columns is None or len(columns) == 0:
            return self
        
        if 'timestamp' in self.df.columns and 'timestamp' not in columns:
            columns = ['timestamp'] + columns
        
        self.df = self.df[columns]
        
        return self
    
    def get_result(self) -> pd.DataFrame:
        if self.df is None:
            raise ValueError("请先加载数据")
        return self.df
    
    def to_dict(self) -> List[Dict[str, Any]]:
        return self.df.to_dict('records')
