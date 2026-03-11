from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class StrategyStep(BaseModel):
    order: int
    action: str
    details: str


class StrategyBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    target: Optional[str] = None
    steps: Optional[List[StrategyStep]] = None
    best_time: Optional[str] = None
    expected_effect: Optional[str] = None


class StrategyCreate(StrategyBase):
    merchant_id: UUID
    opportunity_id: Optional[UUID] = None


class StrategyResponse(StrategyBase):
    id: UUID
    merchant_id: UUID
    opportunity_id: Optional[UUID]
    status: str = "pending"
    created_at: datetime

    class Config:
        from_attributes = True
