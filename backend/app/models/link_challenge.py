import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class LinkChallenge(Base):
    """A pending "confirm it's you" step before linking an OAuth identity to an
    existing password account.

    Auto-linking on email match is the #1 OAuth account-takeover vector, so when
    an OAuth login's email matches an existing password account we do NOT link:
    we create one of these rows and require the user to prove control of the
    existing account (re-enter its password) before the link is written.
    """

    __tablename__ = "link_challenges"
    __table_args__ = (
        CheckConstraint("provider IN ('google', 'github')", name="ck_link_challenge_provider"),
    )

    challenge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(20), nullable=False)
    provider_user_id = Column(String(255), nullable=False)
    email_at_link = Column(String(255), nullable=False)
    remember_me = Column(Boolean, nullable=False, server_default="false", default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
