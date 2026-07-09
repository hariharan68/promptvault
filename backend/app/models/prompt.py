import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    prompt_content = Column(Text, nullable=False)

    is_favorite = Column(Boolean, nullable=False, default=False)
    usage_count = Column(Integer, nullable=False, default=0)
    last_used_at = Column(DateTime, nullable=True)

    deleted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    tags = relationship("Tag", secondary="prompt_tags", lazy="select")