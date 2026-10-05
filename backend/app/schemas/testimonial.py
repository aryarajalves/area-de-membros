from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class TestimonialUser(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TestimonialCourse(BaseModel):
    id: int
    title: str
    thumbnail_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TestimonialCreate(BaseModel):
    course_id: int
    rating: int = Field(..., ge=1, le=5, description="Avaliação em estrelas (1 a 5)")
    title: Optional[str] = Field(None, max_length=200, description="Título do depoimento")
    content: str = Field(..., min_length=3, max_length=5000, description="Texto do relato sobre o curso")


class TestimonialUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, min_length=3, max_length=5000)
    status: Optional[str] = Field(None, description="'pending' | 'approved' | 'rejected'")
    is_featured: Optional[bool] = None


class TestimonialResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    rating: int
    title: Optional[str] = None
    content: str
    status: str
    is_featured: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: TestimonialUser
    course: TestimonialCourse
    can_edit: bool = False
    can_delete: bool = False
    can_moderate: bool = False

    model_config = ConfigDict(from_attributes=True)


class TestimonialStats(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    average_rating: float
