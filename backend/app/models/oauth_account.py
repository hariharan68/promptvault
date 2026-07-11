import uuid

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"
    __table_args__ = (
        CheckConstraint("provider IN ('google', 'github')", name="ck_oauth_accounts_provider"),
        UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_identity"),
        UniqueConstraint("user_id", "provider", name="uq_oauth_user_provider"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider = Column(String(20), nullable=False)
    provider_user_id = Column(String(255), nullable=False)
    email_at_link = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
