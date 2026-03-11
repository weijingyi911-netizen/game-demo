from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class StoryProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class StoryProjectOut(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StoryDraftOut(BaseModel):
    project_id: str
    yaml: str
    updated_at: datetime


class StoryDraftUpsert(BaseModel):
    yaml: str = Field(min_length=1)


class StoryReleaseCreate(BaseModel):
    note: Optional[str] = Field(default=None, max_length=2000)


class StoryReleaseOut(BaseModel):
    id: str
    project_id: str
    version: int
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class StoryRollbackIn(BaseModel):
    release_id: str


class StoryAssetOut(BaseModel):
    id: str
    project_id: Optional[str]
    original_name: str
    file_name: str
    content_type: Optional[str]
    size: int
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StoryReleaseListOut(BaseModel):
    items: List[StoryReleaseOut]

