from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.routers.auth import router as auth_router
from app.routers.groups import router as groups_router
from app.routers.tags import router as tags_router
from app.routers.prompts import router as prompts_router

app = FastAPI(
    title="PromptVault",
    version="1.0.0",
    description="PromptVault — personal AI prompt management platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(tags_router)
app.include_router(prompts_router)


@app.get("/")
def root():
    return {"message": "PromptVault backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"message": "Database connection successful"}
