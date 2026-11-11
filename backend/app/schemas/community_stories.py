from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CommunityStoryCreate(BaseModel):
    media_url: str
    media_type: str = Field(default="image")  # "image" ou "video"
    media_thumbnail_url: Optional[str] = None
    caption: Optional[str] = Field(default=None, max_length=500)
    duration_seconds: int = Field(default=5, ge=1, le=60)
    is_highlight: bool = False
    highlight_title: Optional[str] = Field(default=None, max_length=100)


class CommunityStoryOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_avatar_url: Optional[str] = None
    user_role: str
    media_url: str
    media_type: str
    media_thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    duration_seconds: int = 5
    is_highlight: bool = False
    highlight_title: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    views_count: int = 0
    has_viewed: bool = False
    my_reaction: Optional[str] = None
    is_owner: bool = False

    model_config = ConfigDict(from_attributes=True)


class StoryUserGroupOut(BaseModel):
    user_id: int
    name: str
    avatar_url: Optional[str] = None
    role: str
    has_unviewed: bool = True
    stories_count: int = 1
    latest_story_created_at: datetime
    is_me: bool = False

    model_config = ConfigDict(from_attributes=True)


class StoryViewItem(BaseModel):
    id: int
    user_id: int
    name: str
    avatar_url: Optional[str] = None
    role: str
    viewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StoryReactIn(BaseModel):
    reaction_type: str = Field(..., pattern="^(heart|fire|clap|laugh|rocket)$")


class StoryReplyIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class StoryHighlightToggleIn(BaseModel):
    is_highlight: bool
    highlight_title: Optional[str] = Field(default=None, max_length=100)
