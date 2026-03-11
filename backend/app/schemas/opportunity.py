from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class OpportunityBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    data_evidence: Optional[str] = None
    value_score: int = 3
    effort_score: int = 3
    expected_roi: Optional[str] = None
    recommended_actions: Optional[List[str]] = None


class OpportunityCreate(OpportunityBase):
    merchant_id: UUID


class OpportunityResponse(OpportunityBase):
    id: UUID
    merchant_id: UUID
    status: str = "new"
    created_at: datetime

    class Config:
        from_attributes = True
