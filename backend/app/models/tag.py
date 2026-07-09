import uuid
from sqlalchemy import Column,DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

class Tag(Base):
    __tablename__ = "tags"
    id =Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)   
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name =Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())