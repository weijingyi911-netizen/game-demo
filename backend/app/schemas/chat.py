from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class ChatSessionBase(BaseModel):
    title: Optional[str] = None


class ChatSessionCreate(ChatSessionBase):
    merchant_id: UUID


class ChatSessionResponse(ChatSessionBase):
    id: UUID
    merchant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    content: str


class ChatMessageCreate(ChatMessageBase):
    stream: bool = False


class ChatMessageResponse(ChatMessageBase):
    id: UUID
    session_id: UUID
    role: str
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
