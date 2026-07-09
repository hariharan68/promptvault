import uuid

from sqlalchemy import Boolean, Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

class User(Base):                       # Python class connected to SQLAlchemy Base class, which is connected to the database. This class represents the "users" table in the database.
    __tablename__="users"               # This says model belongs to PostgreSQL

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
