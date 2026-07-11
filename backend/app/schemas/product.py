from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class BulkPromptRequest(BaseModel):
    prompt_ids: list[UUID] = Field(min_length=1, max_length=100)
    action: Literal["delete", "restore", "favorite", "unfavorite", "move", "tag"]
    group_id: UUID | None = None
    tag_names: list[str] = []


class ImportPromptsRequest(BaseModel):
    prompts: list[dict] = Field(min_length=1, max_length=500)
    source: Literal["json", "chatgpt", "claude"] = "json"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)
