from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import settings
from app.api.v1 import auth, dashboard, diagnosis, opportunity, strategy, chat
from app.api.v1 import story
from app.api.v1 import assets
from app.database import init_db

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered business decision support system for merchants",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR), check_dir=False), name="uploads")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["数据看板"])
app.include_router(diagnosis.router, prefix="/api/v1/diagnosis", tags=["智能诊断"])
app.include_router(opportunity.router, prefix="/api/v1/opportunities", tags=["机会发现"])
app.include_router(strategy.router, prefix="/api/v1/strategies", tags=["策略中心"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI对话"])
app.include_router(story.router, prefix="/api/v1/story", tags=["剧情配置"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["资源库"])


@app.on_event("startup")
async def _startup():
    await init_db()


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
