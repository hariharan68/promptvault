# THIS FILE CONNECTS WIHT DB POSTGRESQL 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()   # Load environment variables from .env file

DATABASE_URL = os.getenv("DATABASE_URL")      # Tells FastAPI where PostgreSQL is running

engine=create_engine(DATABASE_URL)            # Engine is the actual database connection engine

SessionLocal = sessionmaker(autocommit=False, # SessionLocal creates a database session for each API request.
                            autoflush=False, 
                            bind=engine
)

Base = declarative_base()

def get_db():   
    # Gives database access to API routes and closes it after work is done                              
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
