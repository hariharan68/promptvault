from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int
    has_next: bool


class PageResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: PageMeta


class CollectionMeta(BaseModel):
    total: int


class CollectionResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: CollectionMeta
