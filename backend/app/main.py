from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import data, train, predict

app = FastAPI(
    title="时序模型平台",
    description="迷你版 TPT2 风格时序大模型平台 - 数据上传、清洗、训练、微调、推理",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(train.router)
app.include_router(predict.router)

@app.get("/")
async def root():
    return {
        "message": "时序模型平台 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
