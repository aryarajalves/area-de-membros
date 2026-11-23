from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field


class FreelanceAuthorOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    phone: Optional[str] = None


class FreelanceJobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=160)
    description: str = Field(..., min_length=10, max_length=4000)
    category: str = Field(..., min_length=2, max_length=60)
    budget_type: Literal["fixed", "hourly", "negotiable"] = "negotiable"
    budget_value: Optional[str] = Field(default=None, max_length=60)
    deadline: Optional[str] = Field(default=None, max_length=100)
    contact_whatsapp: Optional[str] = Field(default=None, max_length=30)


class FreelanceJobUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=160)
    description: Optional[str] = Field(default=None, min_length=10, max_length=4000)
    category: Optional[str] = Field(default=None, min_length=2, max_length=60)
    budget_type: Optional[Literal["fixed", "hourly", "negotiable"]] = None
    budget_value: Optional[str] = Field(default=None, max_length=60)
    deadline: Optional[str] = Field(default=None, max_length=100)
    contact_whatsapp: Optional[str] = Field(default=None, max_length=30)
    status: Optional[Literal["open", "closed"]] = None


class FreelanceJobResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category: str
    budget_type: str
    budget_value: Optional[str] = None
    deadline: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    author: FreelanceAuthorOut
    can_manage: bool = False


class FreelanceJobsListResponse(BaseModel):
    items: List[FreelanceJobResponse]
    can_publish: bool
    total: int
