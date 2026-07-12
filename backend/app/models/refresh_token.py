import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.sql import func

from app.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    token_hash = Column(Text, nullable=False, unique=True)

    # A family is the chain of tokens minted from one login. family_id is constant
    # across rotations; parent_id links each token to the one it replaced. Reuse of
    # an already-rotated token revokes the whole family (theft signal).
    family_id = Column(UUID(as_uuid=True), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True)

    # 'persistent' (remember me) or 'ephemeral' (idle-timeout enforced server-side).
    session_policy = Column(Text, nullable=False, server_default="persistent")

    expires_at = Column(DateTime, nullable=False)
    last_used_at = Column(DateTime, nullable=False, server_default=func.now())
    replaced_at = Column(DateTime, nullable=True)   # set when rotated
    revoked_at = Column(DateTime, nullable=True)    # set on logout / security event
    revoke_reason = Column(Text, nullable=True)     # 'logout','reuse_detected','idle_timeout',...

    # Session metadata for the "your devices" UI, captured at login and inherited
    # by every rotated token in the family so the live tip is self-describing.
    device_label = Column(Text, nullable=True)      # e.g. "Chrome on Windows"
    ip_created = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
