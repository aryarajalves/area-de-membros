from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class WebhookBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Nome da integração")
    url: str = Field(..., description="URL do webhook para receber eventos")
    events: List[str] = Field(default=["course.progress.25", "course.progress.50", "course.progress.75", "course.progress.100"])
    course_id: Optional[int] = Field(None, description="ID do curso específico ou None para todos os cursos")
    secret_key: Optional[str] = Field(None, description="Chave secreta opcional para assinatura HMAC SHA-256")
    is_active: bool = Field(True, description="Status de ativação do webhook")

class WebhookCreate(WebhookBase):
    pass

class WebhookUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    url: Optional[str] = None
    events: Optional[List[str]] = None
    course_id: Optional[int] = None
    secret_key: Optional[str] = None
    is_active: Optional[bool] = None

class WebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    url: str
    events: List[str]
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    secret_key: Optional[str] = None
    is_active: bool
    total_dispatches: int = 0
    success_dispatches: int = 0
    created_at: datetime
    updated_at: datetime

class WebhookLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    webhook_id: int
    event: str
    payload: Dict[str, Any]
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    success: bool
    error_message: Optional[str] = None
    created_at: datetime

class WebhookTestResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    message: str
    response_body: Optional[str] = None
