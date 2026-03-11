import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.models import ChatSession, ChatMessage, User
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
)
from app.core.security import get_current_active_user

router = APIRouter()


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def get_sessions(
    merchant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.merchant_id == merchant_id)
        .order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    data: ChatSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    session = ChatSession(
        id=str(uuid.uuid4()),
        merchant_id=data.merchant_id,
        title=data.title or "新对话",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    return result.scalars().all()


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: str,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_message = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="user",
        content=data.content,
    )
    db.add(user_message)
    
    assistant_message = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="assistant",
        content=generate_mock_response(data.content),
    )
    db.add(assistant_message)
    
    await db.commit()
    await db.refresh(assistant_message)
    
    return assistant_message


def generate_mock_response(question: str) -> str:
    responses = {
        "流量": """根据数据分析，您的流量变化情况如下：

**流量来源分析：**
- 搜索流量：占比 45%，环比下降 8%
- 推荐流量：占比 30%，环比持平
- 直接访问：占比 25%，环比上升 5%

**主要原因：**
1. 搜索排名有所下降，导致搜索流量减少
2. 竞品促销活动分流了部分流量

**建议措施：**
1. 优化商品标题和关键词，提升搜索排名
2. 加大内容营销投入，提升推荐流量
3. 针对老用户发送召回短信，提升直接访问""",
        
        "转化率": """您的转化率分析如下：

**转化漏斗分析：**
- 访问 → 浏览：85%（正常）
- 浏览 → 加购：12%（偏低）
- 加购 → 下单：35%（正常）

**主要问题：**
加购率偏低，说明商品详情页吸引力不足

**优化建议：**
1. 优化商品主图，突出卖点
2. 增加买家秀和好评展示
3. 设置限时优惠，刺激加购""",
        
        "机会": """为您发现以下增长机会：

**🎯 机会一：高价值用户群体**
发现 2,340 名高复购用户，客单价有提升空间
预估 GMV 提升：8%

**🔥 机会二：潜力爆款**
"螺蛳粉"搜索热度上升 156%，建议加大推广
预估流量提升：25%

**⏰ 机会三：营销时机**
下周"三八节"是食品类目高峰期
建议提前 3 天启动促销活动""",
    }
    
    for keyword, response in responses.items():
        if keyword in question:
            return response
    
    return """感谢您的提问！作为您的 AI 经营助手，我可以帮您：

1. **数据分析** - 分析经营数据，找出问题原因
2. **机会发现** - 发现增长机会，提供策略建议
3. **策略生成** - 输出可执行的运营策略

请问您想了解哪方面的内容？"""
