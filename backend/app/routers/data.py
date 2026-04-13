from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
from typing import List, Dict, Any
from ..schemas.schemas import UploadResponse, CleanRequest, CleanResponse
from ..services.cleaner import DataCleaner

router = APIRouter(prefix="/api", tags=["data"])

cleaned_data_store = {}

@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="请上传 CSV 格式文件")
        
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        cleaned_data_store['raw_data'] = df
        
        preview = df.head(10).to_dict('records')
        columns = df.columns.tolist()
        rows = len(df)
        
        return UploadResponse(
            columns=columns,
            rows=rows,
            preview=preview
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

@router.post("/clean", response_model=CleanResponse)
async def clean_data(request: CleanRequest):
    try:
        if 'raw_data' not in cleaned_data_store:
            raise HTTPException(status_code=400, detail="请先上传数据")
        
        df = cleaned_data_store['raw_data']
        
        cleaner = DataCleaner()
        cleaner.load_data(df)
        
        cleaner.handle_missing(request.missing_strategy)
        cleaner.remove_outliers(request.outlier_method)
        cleaner.resample_data(request.resample_freq)
        cleaner.select_columns(request.selected_columns)
        
        cleaned_df = cleaner.get_result()
        cleaned_data_store['cleaned_data'] = cleaned_df
        
        data = cleaned_df.to_dict('records')
        
        return CleanResponse(
            cleaned_rows=len(cleaned_df),
            data=data[:100]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据清洗失败: {str(e)}")

@router.get("/columns")
async def get_columns():
    if 'raw_data' not in cleaned_data_store:
        raise HTTPException(status_code=400, detail="请先上传数据")
    
    df = cleaned_data_store['raw_data']
    columns = df.columns.tolist()
    
    return {"columns": columns}

@router.get("/cleaned-data")
async def get_cleaned_data():
    if 'cleaned_data' not in cleaned_data_store:
        raise HTTPException(status_code=400, detail="请先清洗数据")
    
    df = cleaned_data_store['cleaned_data']
    return {"data": df.to_dict('records')}

@router.post("/numeric")
async def numeric_data():
    try:
        if 'raw_data' not in cleaned_data_store:
            raise HTTPException(status_code=400, detail="请先上传数据")
        
        df = cleaned_data_store['raw_data']
        
        for col in df.columns:
            if col != 'timestamp' and col != 'time' and col != 'date':
                try:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                except:
                    pass
        
        cleaned_data_store['cleaned_data'] = df
        
        data = df.to_dict('records')
        
        return CleanResponse(
            cleaned_rows=len(df),
            data=data[:100]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数值化失败: {str(e)}")
