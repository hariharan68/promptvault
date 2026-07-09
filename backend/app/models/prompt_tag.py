from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class PromptTag(Base):
    __tablename__ = "prompt_tags"

    prompt_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prompts.id", ondelete="CASCADE"),
        primary_key=True
    )

    tag_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True
    )