from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.tag import TagResponse


class PromptBase(BaseModel):
    title: str
    description: Optional[str] = None
    prompt_content: str
    group_id: Optional[UUID] = None


class PromptCreate(PromptBase):
    tag_names: list[str] = []


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prompt_content: Optional[str] = None
    group_id: Optional[UUID] = None
    is_favorite: Optional[bool] = None
    tag_names: Optional[list[str]] = None


class PromptResponse(PromptBase):
    id: UUID
    user_id: UUID
    is_favorite: bool
    usage_count: int
    last_used_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = []

    class Config:
        from_attributes = True
