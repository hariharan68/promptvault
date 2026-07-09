from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True