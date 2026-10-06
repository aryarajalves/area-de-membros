from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SupportCourseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    thumbnail_url: Optional[str] = None


class SupportAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str


class LastReplyInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    author_name: str
    role: str
    created_at: datetime


class SupportReplyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    content: str
    image_url: Optional[str] = None
    is_instructor_reply: bool
    is_solution: bool = False
    created_at: datetime
    author: SupportAuthor


class SupportTopicListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    status: str
    likes_count: int
    replies_count: int
    liked_by_me: bool
    has_solution: bool = False
    is_pinned: bool = False
    is_favorited: bool = False
    course: SupportCourseItem
    author: SupportAuthor
    last_reply: Optional[LastReplyInfo] = None
    created_at: datetime


class SupportTopicDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    status: str
    likes_count: int
    liked_by_me: bool
    has_solution: bool = False
    is_pinned: bool = False
    is_favorited: bool = False
    course: SupportCourseItem
    author: SupportAuthor
    created_at: datetime
    last_reply_user_name: Optional[str] = None
    last_reply_at: Optional[datetime] = None
    replies: List[SupportReplyResponse] = []


class SupportTopicListResponse(BaseModel):
    items: List[SupportTopicListItem]
    total: int
    page: int
    page_size: int


class SupportTopicCreate(BaseModel):
    course_id: int
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5)
    image_url: Optional[str] = None


class SupportReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)
    image_url: Optional[str] = None


class SupportStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|resolved|closed)$")


class SupportStatsResponse(BaseModel):
    total_topics: int
    unanswered_count: int
    resolved_count: int
    resolution_rate_pct: int
    active_members_count: int


class SupportTopicPinResponse(BaseModel):
    pinned: bool
    message: str
    total_pinned: int

