# 时序模型平台 - 迷你版

* 一个简洁易用的工业时序数据建模平台，实现从数据上传到模型微调的完整流程。

## 功能特性

- ✅ CSV 数据上传与预览
- ✅ 数据清洗（缺失值、异常值、重采样）
- ✅ LSTM 模型训练（多步预测）
- ✅ 模型微调（增量训练）
- ✅ 生成工业智能体 API

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
- Pandas (数据处理)

## 快速开始

### 环境要求

- Node.js 16+
- Python 3.10+
- pip 或 conda

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd Timeseries-mini
```

2. **安装后端依赖**

```bash
cd backend
pip install -r requirements.txt
```

3. **安装前端依赖**

```bash
cd frontend
npm install
```

### 启动服务

#### Windows

```bash
start.bat
```

#### Linux/Mac

```bash
chmod +x start.sh
./start.sh
```

#### 手动启动

**启动后端：**

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**启动前端：**

```bash
cd frontend
npm run dev
```

### 访问地址

- 前端界面: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 使用流程

### 1. 上传数据

- 点击"选择 CSV 文件"按钮
- 选择包含时序数据的 CSV 文件
- 点击"上传"按钮
- 查看数据预览

### 2. 数据清洗

- 选择缺失值处理方法（前向填充/均值填充/删除）
- 选择异常值处理方法（3σ原则/IQR方法/不处理）
- 选择重采样频率（可选）
- 选择保留的列（可选）
- 点击"应用清洗"

### 3. 模型训练

- 选择目标列（要预测的测点）
- 设置回看窗口（12-48小时）
- 设置预测步数（1-24小时）
- 设置训练轮数和学习率
- 点击"开始训练"

### 4. 模型微调

- 选择已训练的模型
- 设置微调轮数
- 点击"微调模型"
- 点击"生成智能体"获取 API 端点

## 示例数据

项目包含示例数据文件 `sample_data.csv`，包含以下测点：

- temperature (温度)
- pressure (压力)
- flow_rate (流量)
- humidity (湿度)

## API 接口

### 数据上传

```
POST /api/upload
```

### 数据清洗

```
POST /api/clean
```

### 模型训练

```
POST /api/train
```

### 模型微调

```
POST /api/finetune
```

### 模型推理

```
POST /api/predict
```

详细 API 文档请访问: http://localhost:8000/docs

## 项目结构

```
Timeseries-mini/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API 调用
│   │   ├── context/         # 状态管理
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # FastAPI 后端
│   ├── app/
│   │   ├── routers/         # API 路由
│   │   ├── models/          # 模型定义
│   │   ├── services/        # 业务逻辑
│   │   ├── schemas/         # 数据模型
│   │   └── main.py
│   ├── requirements.txt
│   └── saved_models/        # 保存的模型
│
├── docs/                     # 文档
│   └── plans/
│
├── sample_data.csv          # 示例数据
├── start.bat                # Windows 启动脚本
└── start.sh                 # Linux/Mac 启动脚本
```

## 设计原则

- **简洁易懂**: 代码适合新手小白阅读
- **DRY 原则**: 避免代码重复
- **SOLID 原则**: 遵循面向对象设计原则
- **概念验证**: 专注于核心功能，避免过度设计

## 注意事项

1. 首次运行需要安装依赖，可能需要几分钟
2. 训练模型时请确保有足够的数据（建议至少 100 行）
3. 模型保存在 `backend/saved_models/` 目录
4. 如遇到端口占用，请修改启动脚本中的端口号

## 后续优化

- [ ] 添加数据可视化图表
- [ ] 支持更多模型（TimesNet、Transformer）
- [ ] 添加模型评估指标
- [ ] 支持实时数据流
- [ ] Docker 容器化部署

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。
