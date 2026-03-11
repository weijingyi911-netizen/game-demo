# AI 商家经营决策系统

智能经营决策助手，让每一位商家都能看懂数据、理解原因、发现机会、采取行动。

## 功能特性

- 📊 **数据看板** - 核心经营指标一目了然，异常告警及时提醒
- 🔍 **智能诊断** - AI 自动分析问题根因，无需专业分析能力
- 💡 **机会发现** - 基于数据挖掘隐藏的增长机会
- 📋 **策略中心** - 从洞察到行动，输出可执行策略清单
- 💬 **AI 对话** - 自然语言提问，降低使用门槛

## 技术栈

### 前端
- Next.js 14 + React 18
- TypeScript
- Ant Design 5
- ECharts
- TailwindCSS
- Zustand

### 后端
- Python 3.11
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Redis
- LangChain

### AI
- OpenAI GPT-4
- 通义千问
- 文心一言

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 使用 Docker 启动（推荐）

```bash
# 克隆项目
git clone <repository>
cd business-ai

# 复制环境变量
cp .env.example .env

# 启动服务
docker-compose up -d

# 初始化数据库
docker-compose exec backend python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"

# 访问应用
open http://localhost:3001
```

### 本地开发

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn app.main:app --reload --port 8001
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
business-ai/
├── frontend/                # 前端项目
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 组件
│   ├── services/            # API 服务
│   ├── stores/              # 状态管理
│   └── ...
│
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic 模型
│   │   ├── services/        # 业务逻辑
│   │   └── core/            # 核心功能
│   └── ...
│
├── docs/                    # 文档
│   ├── PRD.md               # 产品需求文档
│   └── 技术方案.md          # 技术实现方案
│
├── docker-compose.yml       # Docker 编排
└── README.md
```

## API 文档

启动后端服务后，访问：
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 环境变量

| 变量名 | 说明 | 默认值 |
|-------|------|--------|
| DATABASE_URL | PostgreSQL 连接字符串 | postgresql+asyncpg://postgres:postgres@localhost:5432/business_ai |
| REDIS_URL | Redis 连接字符串 | redis://localhost:6379 |
| JWT_SECRET | JWT 密钥 | - |
| OPENAI_API_KEY | OpenAI API 密钥 | - |
| QWEN_API_KEY | 通义千问 API 密钥 | - |

## 访问地址

- **前端**: http://localhost:3001
- **后端 API 文档**: http://localhost:8001/docs

## 开发指南

### 代码规范

- 前端使用 ESLint + Prettier
- 后端使用 Black + isort
- 提交信息遵循 Conventional Commits

### 分支管理

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 热修复分支

## License

MIT
