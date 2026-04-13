# 时序模型平台设计文档

## 概述

设计一个迷你版 TPT2 风格时序大模型平台，实现从数据上传到模型微调的完整流程。

## 技术栈

### 前端
- React 18 + TypeScript
- Material UI (UI 组件库)
- Chart.js (数据可视化)
- Axios (HTTP 客户端)

### 后端
- Python 3.10+
- FastAPI (Web 框架)
- PyTorch (深度学习框架)
- tsai (TimesNet 模型库)
- Pandas (数据处理)

### 模型
- TimesNet (2023 ICLR 最佳时序模型)
- 多步预测模式
- 自动捕获多周期模式

## 项目结构

```
Timeseries-mini/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   │   ├── DataUpload.tsx
│   │   │   ├── DataCleaning.tsx
│   │   │   ├── ModelTraining.tsx
│   │   │   └── ModelFinetune.tsx
│   │   ├── pages/           # 页面组件
│   │   │   ├── UploadPage.tsx
│   │   │   ├── CleanPage.tsx
│   │   │   ├── TrainPage.tsx
│   │   │   └── FinetunePage.tsx
│   │   ├── services/        # API 调用
│   │   │   └── api.ts
│   │   ├── context/         # 状态管理
│   │   │   └── AppContext.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # FastAPI 后端
│   ├── app/
│   │   ├── routers/         # API 路由
│   │   │   ├── data.py
│   │   │   ├── train.py
│   │   │   └── predict.py
│   │   ├── models/          # TimesNet 模型
│   │   │   └── timesnet.py
│   │   ├── services/        # 业务逻辑
│   │   │   ├── cleaner.py
│   │   │   └── trainer.py
│   │   ├── schemas/         # 数据模型
│   │   │   └── schemas.py
│   │   └── main.py
│   ├── requirements.txt
│   └── saved_models/        # 保存的模型
│
└── docs/                     # 文档
    └── plans/
```

## API 接口设计

### 数据上传
```
POST /api/upload
输入: multipart/form-data (CSV 文件)
输出: { "columns": [...], "rows": 1000, "preview": [...] }
```

### 数据清洗
```
POST /api/clean
输入: { 
  "missing_strategy": "ffill|mean|drop",
  "outlier_method": "3sigma|iqr|none",
  "resample_freq": "1min|5min|1h|none",
  "selected_columns": [...]
}
输出: { "cleaned_rows": 950, "data": [...] }
```

### 模型训练
```
POST /api/train
输入: {
  "target_column": "temperature",
  "lookback": 24,
  "forecast_steps": 6,
  "epochs": 50,
  "learning_rate": 0.001
}
输出: { "model_id": "model_001", "train_loss": 0.05, "status": "success" }
```

### 模型微调
```
POST /api/finetune
输入: { "model_id": "model_001", "new_data": [...], "epochs": 10 }
输出: { "finetune_loss": 0.03, "status": "success" }
```

### 模型推理
```
POST /api/predict
输入: { "model_id": "model_001", "input_data": [...] }
输出: { "predictions": [...] }
```

### 训练进度 (WebSocket)
```
WS /ws/train/{model_id}
输出: { "epoch": 10, "loss": 0.05, "progress": 0.2 }
```

## 前端页面流程

### 1. 上传页面
- 文件选择器（支持拖拽上传）
- 数据预览表格（前 10 行）
- 列信息展示（列名、类型、缺失值统计）
- "下一步"按钮跳转到清洗页面

### 2. 清洗页面
- 缺失值处理：下拉选择
- 异常值处理：下拉选择（3σ原则 / IQR / 无）
- 重采样：下拉选择（1min / 5min / 1h / 无）
- 列筛选：多选框
- 实时预览清洗效果
- "应用清洗"按钮

### 3. 训练页面
- 目标列选择：下拉选择要预测的测点
- 模型参数配置：
  - 回看窗口：滑块（12-48小时）
  - 预测步数：滑块（1-24小时）
  - 训练轮数：输入框
- 训练进度条
- 损失曲线图
- "开始训练"按钮

### 4. 微调页面
- 上传新数据
- 选择已有模型
- 微调参数配置
- 微调进度展示
- 生成推理 API URL（工业智能体）

## 数据流设计

### 前端状态管理
使用 React Context API 管理全局状态：

```typescript
interface AppState {
  rawData: DataFrame | null;
  cleanedData: DataFrame | null;
  currentModel: {
    id: string;
    status: 'idle' | 'training' | 'ready';
    metrics: { trainLoss: number };
  } | null;
  trainingProgress: {
    epoch: number;
    totalEpochs: number;
    loss: number;
  } | null;
}
```

### 数据流转
1. 上传阶段：用户上传 CSV → 后端解析 → 返回预览数据 → 存储到 rawData
2. 清洗阶段：用户配置清洗参数 → 后端执行清洗 → 返回清洗结果 → 存储到 cleanedData
3. 训练阶段：用户配置模型参数 → 后端训练 TimesNet → WebSocket 推送进度 → 更新 trainingProgress
4. 微调阶段：用户上传新数据 → 后端加载模型 → 增量训练 → 更新模型
5. 推理阶段：用户输入数据 → 后端推理 → 返回预测结果

## TimesNet 模型配置

```python
from tsai.models.TimesNet import TimesNet

model = TimesNet(
    c_in=num_features,      # 输入特征数
    c_out=forecast_steps,   # 预测步数
    seq_len=lookback,       # 回看窗口
    top_k=3,                # Top-k 周期
    d_model=32,             # 模型维度
    e_layers=2,             # 编码器层数
    d_ff=64,                # 前馈网络维度
)
```

## 错误处理

### 前端
- API 调用错误处理（try-catch）
- 数据验证（文件格式、大小限制）
- 用户友好的错误提示

### 后端
- HTTP 异常处理（HTTPException）
- 数据验证（Pydantic）
- 训练过程异常捕获

## 测试策略

### 后端测试
- API 端点测试（pytest）
- 数据处理测试
- 模型训练测试

### 前端测试
- 组件测试（React Testing Library）
- 用户交互测试
- API 调用测试

## 设计原则

### SOLID 原则
- **单一职责**：每个组件/模块只负责一个功能
- **开闭原则**：通过接口扩展，不修改现有代码
- **里氏替换**：子类可以替换父类
- **接口隔离**：接口最小化
- **依赖倒置**：依赖抽象而非具体实现

### DRY 原则
- 避免代码重复
- 提取可复用组件
- 统一错误处理

## 部署方案

### 开发环境
```bash
# 前端
cd frontend
npm install
npm run dev

# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 生产环境
- 前端：构建静态文件，部署到 Nginx
- 后端：使用 Gunicorn + Uvicorn
- 数据库：SQLite（概念验证）或 PostgreSQL（生产）

## 下一步

1. 创建项目目录结构
2. 实现后端 API
3. 实现前端页面
4. 集成测试
5. 编写文档
