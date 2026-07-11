import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    prompt_content = Column(Text, nullable=False)
    group_id = Column(UUID(as_uuid=True), nullable=True)
    is_favorite = Column(Boolean, nullable=False, default=False)
    variables = Column(JSON, nullable=False, default=dict)
    tags = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
