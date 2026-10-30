from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    certificate_code: str
    user_id: int
    course_id: int
    student_name: str
    course_title: str
    workload_hours: int
    workload_label: Optional[str] = None
    instructor_name: Optional[str] = None
    issued_at: datetime


class CertificateStatusResponse(BaseModel):
    eligible: bool
    certificate_enabled: bool = True
    progress_pct: int
    completed_lessons: int
    total_lessons: int
    certificate: Optional[CertificateResponse] = None


class CertificatePublicValidationResponse(BaseModel):
    is_valid: bool
    certificate_code: str
    student_name: Optional[str] = None
    course_title: Optional[str] = None
    workload_hours: Optional[int] = None
    workload_label: Optional[str] = None
    instructor_name: Optional[str] = None
    issued_at: Optional[datetime] = None
