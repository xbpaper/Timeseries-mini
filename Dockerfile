FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 安装Node.js和npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# 先复制前端依赖文件
COPY frontend/package*.json ./frontend/

# 安装前端依赖
WORKDIR /app/frontend
RUN npm install

# 复制前端代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 复制后端依赖文件
WORKDIR /app
COPY backend/requirements.txt ./backend/

# 安装后端依赖
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./

# 复制前端构建产物到后端静态文件目录
RUN mkdir -p app/static
RUN cp -r /app/frontend/dist/* app/static/

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]