from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CommunityCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = None


class CommunityCommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    user_role: str
    parent_id: Optional[int] = None
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityPostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2200)
    course_id: Optional[int] = None
    media_urls: Optional[List[str]] = None
    media_type: Optional[str] = "none"
    media_thumbnail_url: Optional[str] = None


class CommunityPostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2200)
    media_thumbnail_url: Optional[str] = None
    is_pinned: Optional[bool] = None


class CommunityPostOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    user_role: str
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    content: str
    media_urls: Optional[List[str]] = None
    media_type: str = "none"
    media_thumbnail_url: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    is_liked_by_me: bool = False
    is_bookmarked_by_me: bool = False
    is_pinned: bool = False
    created_at: datetime
    comments: Optional[List[CommunityCommentOut]] = []

    model_config = ConfigDict(from_attributes=True)


class CommunityLikeUserOut(BaseModel):
    user_id: int
    name: str
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False
    is_me: bool = False

    model_config = ConfigDict(from_attributes=True)


class CommunityMentionCandidate(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    role: str

    model_config = ConfigDict(from_attributes=True)


class CommunityFeedListResponse(BaseModel):
    posts: List[CommunityPostOut]
    total: int
    page: int
    pages: int


class CommunityNotificationOut(BaseModel):
    id: int
    user_id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_avatar: Optional[str] = None
    notification_type: str  # 'feed_like', 'feed_comment', 'feed_mention', 'feed_follow'
    post_id: Optional[int] = None
    comment_id: Optional[int] = None
    title: str
    message: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityNotificationListResponse(BaseModel):
    notifications: List[CommunityNotificationOut]
    unread_count: int
    total: int


class CommunityProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=30)
    bio: Optional[str] = Field(None, max_length=150)
    bio_link: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = None


class CommunityUserProfileOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    bio_link: Optional[str] = None
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    is_me: bool = False
    created_at: datetime
    posts: List[CommunityPostOut] = []

    model_config = ConfigDict(from_attributes=True)


class FollowToggleOut(BaseModel):
    following: bool
    followers_count: int
    following_count: int


class FollowUserItem(BaseModel):
    id: int
    name: str
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False
    is_me: bool = False

    model_config = ConfigDict(from_attributes=True)


class PostViewerOut(BaseModel):
    user_id: int
    name: str
    role: str
    avatar_url: Optional[str] = None
    viewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PostInsightsOut(BaseModel):
    post_id: int
    views_count: int
    likes_count: int
    comments_count: int
    bookmarks_count: int
    total_interactions: int
    engagement_rate: float
    recent_viewers: List[PostViewerOut] = []
    created_at: datetime
