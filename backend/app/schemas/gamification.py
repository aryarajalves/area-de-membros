from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class GamificationStudentItem(BaseModel):
    rank: int
    user_id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    points: int
    solutions_count: int = 0
    lessons_completed_count: int = 0
    badge: str
    is_current_user: bool = False

    model_config = ConfigDict(from_attributes=True)


class GamificationRankingResponse(BaseModel):
    period: str  # 'monthly' | 'all_time'
    month_name: str
    ranking: List[GamificationStudentItem]
    my_position: Optional[GamificationStudentItem] = None
    total_participants: int


class GamificationHistoryItem(BaseModel):
    id: int
    action: str
    points: int
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GamificationRuleItem(BaseModel):
    action: str
    name: str
    points: int
    description: str
    daily_limit: Optional[str] = None
