import uuid

from sqlalchemy import Boolean, Column, Index, String, Text, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

class User(Base):                       # Python class connected to SQLAlchemy Base class, which is connected to the database. This class represents the "users" table in the database.
    __tablename__="users"               # This says model belongs to PostgreSQL

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    # Email uniqueness is enforced case-insensitively by ux_users_email_lower
    # (below), not a plain column UNIQUE — so User@x.com and user@x.com collide.
    email = Column(String(255), nullable=False)
    password_hash = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    token_version = Column(Integer, nullable=False, server_default="0", default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ux_users_email_lower", func.lower(email), unique=True),
    )

    @property
    def has_password(self) -> bool:
        return bool(self.password_hash)
