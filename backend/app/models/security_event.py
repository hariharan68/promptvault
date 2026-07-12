import uuid

from sqlalchemy import Column, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class SecurityEvent(Base):
    """Audit trail for security-relevant auth events (e.g. refresh-token reuse).

    Deliberately not foreign-keyed to users: events must survive account deletion
    for incident forensics.
    """

    __tablename__ = "security_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    family_id = Column(UUID(as_uuid=True), nullable=True)
    event_type = Column(Text, nullable=False)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
