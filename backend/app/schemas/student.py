from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StudentCourseProgressItem(BaseModel):
    course_id: int
    course_title: str
    thumbnail_url: Optional[str] = None
    access_duration: Optional[str] = "lifetime"
    enrolled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_expired: bool = False
    days_remaining: Optional[int] = None
    time_progress_percent: Optional[int] = None
    total_lessons: int = 0
    completed_lessons: int = 0
    progress_percent: int = 0
    last_lesson_title: Optional[str] = None
    last_activity_at: Optional[datetime] = None

class StudentListItem(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None
    courses: List[StudentCourseProgressItem] = []
    total_courses: int = 0
    overall_progress_percent: int = 0

class StudentListResponse(BaseModel):
    items: List[StudentListItem]
    total: int
    page: int
    limit: int
    pages: int

class StudentImportResponse(BaseModel):
    total_processed: int
    created_count: int
    updated_count: int
    errors_count: int
    errors: List[str] = []

class StudentLessonActivityItem(BaseModel):
    lesson_id: int
    lesson_title: str
    module_title: Optional[str] = None
    is_completed: bool = True
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
