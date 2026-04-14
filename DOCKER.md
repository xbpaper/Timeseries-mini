# Docker 部署指南

本指南将帮助您使用 Docker 容器化部署时序模型平台。

## 目录结构

```
Timeseries-mini/
├── Dockerfile           # 单一容器 Dockerfile
├── backend/             # 后端代码
├── frontend/            # 前端代码
└── DOCKER.md            # Docker 部署指南
```

## 前置条件

- 安装 [Docker](https://www.docker.com/get-started)

## 构建和运行

### 构建镜像

```bash
docker build -t timeseries-platform .
```

### 运行容器

```bash
docker run -d --name timeseries-platform -p 8080:8080 timeseries-platform
```

### 查看容器状态

```bash
docker ps
```

### 查看日志

```bash
docker logs -f timeseries-platform
```

### 停止容器

```bash
docker stop timeseries-platform
```

### 移除容器

```bash
docker rm timeseries-platform
```

## 服务访问

- **平台访问**：http://localhost:8080
- **API 文档**：http://localhost:8080/docs
- **健康检查**：http://localhost:8080/health

## 环境变量

| 变量名 | 说明 | 默认值 |
|-------|------|-------|
| PYTHONUNBUFFERED | 启用 Python 输出缓冲 | 1 |
| NODE_ENV | 前端运行环境 | production |

## 容器内部结构

```
/app/
├── frontend/            # 前端源代码
├── backend/             # 后端源代码
│   ├── app/             # 后端应用
│   │   ├── static/      # 前端构建产物
│   │   ├── routers/     # API 路由
│   │   ├── services/    # 业务逻辑
│   │   └── main.py      # 应用入口
│   └── requirements.txt # Python 依赖
└── Dockerfile           # Docker 配置文件
```

## 构建流程

1. **基础镜像**：使用 Python 3.10 作为基础镜像
2. **系统依赖**：安装必要的系统依赖，包括 gcc、build-essential 和 curl
3. **Node.js 安装**：安装 Node.js 18 和 npm
4. **前端构建**：
   - 复制前端代码
   - 安装前端依赖
   - 构建前端应用
5. **后端配置**：
   - 复制后端代码
   - 安装 Python 依赖
   - 将前端构建产物复制到后端静态文件目录
6. **端口暴露**：暴露 8080 端口
7. **启动命令**：启动后端服务

## 开发模式

### 本地开发

对于开发环境，建议直接在本地运行：

1. **后端开发**：
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **前端开发**：
   ```bash
   cd frontend
   npm run dev
   ```

### 容器开发

如需在容器中开发，修改 Dockerfile 使用开发模式启动命令：

1. **后端**：添加 `--reload` 参数
2. **前端**：使用 `npm run dev` 作为启动命令

## 生产环境

1. **构建优化**：使用多阶段构建减小镜像体积
2. **资源限制**：根据实际硬件情况调整容器资源限制
3. **安全配置**：配置适当的安全措施，如 HTTPS、身份验证等
4. **监控**：添加监控和日志收集

## 故障排查

### 常见问题

1. **端口占用**
   - 确保端口 8080 未被其他服务占用

2. **依赖安装失败**
   - 检查网络连接
   - 尝试使用国内镜像源

3. **服务启动失败**
   - 查看容器日志：`docker logs timeseries-platform`
   - 检查代码和配置文件

4. **前端访问后端 API 失败**
   - 确保 API_BASE_URL 配置正确（使用相对路径 `/api`）
   - 检查 CORS 配置

### 日志查看

```bash
docker logs timeseries-platform
```

## 注意事项

1. **数据持久化**：当前配置未包含数据持久化，重启容器后数据会丢失
2. **资源限制**：根据实际硬件情况调整容器资源限制
3. **安全配置**：生产环境应配置适当的安全措施
4. **性能优化**：根据实际需求调整服务参数和资源分配

## 版本信息

- Python: 3.10
- Node.js: 18
- FastAPI: 最新版
- React: 18
