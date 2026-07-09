from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PromptSearchParams(BaseModel):
    q: Optional[str] = None
    group_id: Optional[UUID] = None
    tag: Optional[str] = None
    is_favorite: Optional[bool] = None