from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.group import GroupCreate, GroupResponse, GroupUpdate
from app.services.group_service import (
    create_group,
    delete_group,
    get_group_by_id,
    get_group_by_name,
    get_groups,
    update_group,
)

router = APIRouter(
    prefix="/api/v1/groups",
    tags=["Groups"]
)


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_new_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_group = get_group_by_name(db, group_data.name, current_user.id)

    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group name already exists"
        )

    return create_group(db, group_data, current_user.id)


@router.get("/", response_model=List[GroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_groups(db, current_user.id)


@router.get("/{group_id}", response_model=GroupResponse)
def get_single_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_group_by_id(db, group_id, current_user.id)

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    return group


@router.put("/{group_id}", response_model=GroupResponse)
def update_existing_group(
    group_id: UUID,
    group_data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_group_by_id(db, group_id, current_user.id)

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    if group_data.name:
        existing_group = get_group_by_name(db, group_data.name, current_user.id)

        if existing_group and existing_group.id != group.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group name already exists"
            )

    return update_group(db, group, group_data)


@router.delete("/{group_id}")
def delete_existing_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_group_by_id(db, group_id, current_user.id)

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    delete_group(db, group)

    return {
        "message": "Group deleted successfully"
    }