from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class StrikeCreateIn(BaseModel):
    user_id: int
    reason: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    post_id: Optional[int] = None
    comment_id: Optional[int] = None


class StrikeAppealIn(BaseModel):
    reason: str = Field(..., min_length=5, max_length=1000)


class StrikeOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    moderator_id: Optional[int] = None
    post_id: Optional[int] = None
    comment_id: Optional[int] = None
    reason: str
    description: Optional[str] = None
    strike_number: int
    appeal_status: str
    appeal_reason: Optional[str] = None
    appeal_reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MyStrikesStatusOut(BaseModel):
    strikes_count: int
    is_banned: bool
    strikes: List[StrikeOut] = []


class StrikeAppealReviewIn(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
