from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class IntroductionCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Conteúdo do comentário")


class IntroductionCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    user_name: str
    user_role: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime


class IntroductionPostCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Título da apresentação")
    content: str = Field(..., min_length=5, max_length=20000, description="Texto de apresentação")


class IntroductionPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    content: Optional[str] = Field(None, min_length=5, max_length=20000)


class IntroductionPostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    user_role: str
    user_avatar: Optional[str] = None
    title: str
    content: str
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    last_comment_user_name: Optional[str] = None
    last_comment_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comments: List[IntroductionCommentOut] = []


class IntroductionLikeResponse(BaseModel):
    liked: bool
    likes_count: int
