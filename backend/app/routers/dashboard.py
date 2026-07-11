from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.prompt import PromptResponse
from app.schemas.common import CollectionResponse
from app.services.dashboard_service import get_dashboard_stats, get_recent_prompts

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dashboard_stats(db, current_user.id)


@router.get("/recent", response_model=CollectionResponse[PromptResponse])
def dashboard_recent(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prompts = get_recent_prompts(db, current_user.id, limit)
    return {"data": prompts, "meta": {"total": len(prompts)}}
