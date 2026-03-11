from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Strategy, User
from app.schemas.strategy import StrategyResponse
from app.core.security import get_current_active_user

router = APIRouter()


@router.get("", response_model=dict)
async def get_strategies(
    merchant_id: str,
    type: str = None,
    status: str = None,
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Strategy).where(Strategy.merchant_id == merchant_id)
    
    if type:
        query = query.where(Strategy.type == type)
    if status:
        query = query.where(Strategy.status == status)
    
    offset = (page - 1) * page_size
    query = query.order_by(Strategy.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {"items": items, "total": len(items), "page": page, "page_size": page_size}


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id)
    )
    return result.scalar_one_or_none()


@router.post("/{strategy_id}/execute")
async def execute_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id)
    )
    strategy = result.scalar_one_or_none()
    if strategy:
        strategy.status = "in_progress"
        await db.commit()
    return {"message": "Strategy marked as executing"}


@router.patch("/{strategy_id}/status")
async def update_status(
    strategy_id: str,
    status: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id)
    )
    strategy = result.scalar_one_or_none()
    if strategy:
        strategy.status = status.get("status", strategy.status)
        await db.commit()
    return {"message": "Status updated"}
