from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.tag import TagCreate, TagResponse
from app.schemas.common import CollectionResponse
from app.services.tag_service import (
    create_tag,
    get_tag_by_id,
    get_tag_by_name,
    get_tags,
)

router = APIRouter(
    prefix="/api/v1/tags",
    tags=["Tags"]
)


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_new_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_tag = get_tag_by_name(db, tag_data.name, current_user.id)

    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists"
        )

    return create_tag(db, tag_data, current_user.id)


@router.get("/", response_model=CollectionResponse[TagResponse])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tags = get_tags(db, current_user.id)
    return {"data": tags, "meta": {"total": len(tags)}}


@router.get("/{tag_id}", response_model=TagResponse)
def get_single_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = get_tag_by_id(db, tag_id, current_user.id)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    return tag
