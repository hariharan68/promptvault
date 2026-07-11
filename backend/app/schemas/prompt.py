from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.tag import TagResponse


class PromptBase(BaseModel):
    title: str
    description: Optional[str] = None
    prompt_content: str
    group_id: Optional[UUID] = None
    variables: dict[str, dict[str, str | None]] = Field(default_factory=dict)


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


class PromptVersionResponse(BaseModel):
    id: UUID
    prompt_id: UUID
    version_number: int
    title: str
    description: Optional[str] = None
    prompt_content: str
    group_id: Optional[UUID] = None
    is_favorite: bool
    variables: dict = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True
