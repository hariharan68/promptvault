import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class OAuthTransaction(Base):
    """Server-side record of an in-flight OAuth authorization.

    Replaces the fixed-name state/pkce/remember cookies. The row is the authority:
    `state` is looked up here (so a forged state that isn't in the table is
    rejected), `consumed_at` is set atomically on the callback (single-use →
    replay protection), and each tab gets its own row (→ multi-tab logins work).
    """

    __tablename__ = "oauth_transactions"
    __table_args__ = (
        CheckConstraint("provider IN ('google', 'github')", name="ck_oauth_txn_provider"),
    )

    txn_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(20), nullable=False)
    state = Column(Text, nullable=False, unique=True)
    pkce_verifier = Column(Text, nullable=False)
    remember_me = Column(Boolean, nullable=False, server_default="false", default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
