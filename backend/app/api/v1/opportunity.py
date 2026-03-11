import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.models import Opportunity, User
from app.schemas.opportunity import OpportunityResponse, OpportunityCreate
from app.core.security import get_current_active_user

router = APIRouter()


@router.get("", response_model=dict)
async def get_opportunities(
    merchant_id: str,
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Opportunity)
        .where(Opportunity.merchant_id == merchant_id)
        .order_by(Opportunity.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()
    
    return {"items": items, "total": len(items), "page": page, "page_size": page_size}


@router.post("/scan", response_model=list[OpportunityResponse])
async def scan_opportunities(
    merchant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    opportunities = [
        Opportunity(
            id=str(uuid.uuid4()),
            merchant_id=merchant_id,
            type="user_segment",
            title="高价值用户群体",
            description="发现2,340名高购买频次+低客单价用户",
            data_evidence="购买频次平均4.2次/月，客单价¥45",
            value_score=4,
            effort_score=2,
            expected_roi="GMV +8%",
            recommended_actions=[
                "推送满减活动（满99减15）",
                "推荐组合装/套装商品",
            ],
            status="new",
        ),
        Opportunity(
            id=str(uuid.uuid4()),
            merchant_id=merchant_id,
            type="product",
            title="潜力爆款商品",
            description="发现3款商品具备爆款潜力",
            data_evidence="螺蛳粉搜索热度↑156%，库存充足",
            value_score=3,
            effort_score=2,
            expected_roi="流量 +25%",
            recommended_actions=[
                "加大推广力度",
                "设置爆款专区",
            ],
            status="new",
        ),
    ]
    
    for opp in opportunities:
        db.add(opp)
    await db.commit()
    
    return opportunities


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == opportunity_id)
    )
    return result.scalar_one_or_none()


@router.patch("/{opportunity_id}/status")
async def update_status(
    opportunity_id: str,
    status: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == opportunity_id)
    )
    opportunity = result.scalar_one_or_none()
    if opportunity:
        opportunity.status = status.get("status", opportunity.status)
        await db.commit()
    return {"message": "Status updated"}
