#!/bin/bash

echo "启动后端服务..."
cd backend
python -m uvicorn app.main:app --reload --port 8000 &

echo "等待后端启动..."
sleep 3

echo "启动前端服务..."
cd ../frontend
npm run dev &

echo "服务启动完成！"
echo "后端地址: http://localhost:8000"
echo "前端地址: http://localhost:3000"
echo "API文档: http://localhost:8000/docs"
