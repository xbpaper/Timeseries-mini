# 快速启动指南

## 第一步：安装依赖

### 后端依赖
```bash
cd backend
pip install -r requirements.txt
```

### 前端依赖
```bash
cd frontend
npm install
```

## 第二步：启动服务

### 方式一：使用启动脚本（推荐）

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 方式二：手动启动

**终端 1 - 启动后端：**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm run dev
```

## 第三步：访问应用

- 前端界面: http://localhost:3000
- 后端 API 文档: http://localhost:8000/docs

## 第四步：使用示例数据

1. 打开前端界面
2. 点击"选择 CSV 文件"
3. 选择项目根目录下的 `sample_data.csv`
4. 按照界面提示完成数据清洗、模型训练等步骤

## 常见问题

### 1. 端口被占用
修改启动脚本中的端口号，或关闭占用端口的程序。

### 2. 依赖安装失败
- Python: 确保使用 Python 3.10+
- Node.js: 确保使用 Node.js 16+
- 尝试使用国内镜像源

### 3. 模型训练失败
- 确保数据量足够（建议至少 100 行）
- 检查数据格式是否正确
- 查看后端日志排查错误

## 下一步

- 查看完整文档: [README.md](README.md)
- 查看设计文档: [docs/plans/2026-04-13-timeseries-platform-design.md](docs/plans/2026-04-13-timeseries-platform-design.md)
- API 文档: http://localhost:8000/docs
