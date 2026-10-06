from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class BroadcastEstimateRequest(BaseModel):
    filter_type: str = Field(default="all", description="'all' | 'course' | 'tag' | 'manual' | 'no_course' | 'recent_days'")
    filter_course_id: Optional[int] = None
    filter_tag_id: Optional[int] = None
    filter_days: Optional[int] = Field(default=None, description="Recência de cadastro: 7, 14 ou 30 dias")
    filter_role: Optional[str] = Field(default="aluno", description="'aluno' | 'all'")
    manual_student_ids: Optional[List[int]] = Field(default=[], description="Lista de IDs quando manual")


class BroadcastEstimateResponse(BaseModel):
    total_recipients: int
    estimated_duration_seconds: int
    delay_seconds: int = 1
    sample_students: List[dict] = []


class BroadcastCampaignCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Título da campanha de disparo")
    message: str = Field(..., min_length=1, description="Texto da mensagem privada a ser enviada")
    filter_type: str = Field(default="all", description="'all' | 'course' | 'tag' | 'manual' | 'no_course' | 'recent_days'")
    filter_course_id: Optional[int] = None
    filter_tag_id: Optional[int] = None
    filter_days: Optional[int] = Field(default=None, description="Recência de cadastro: 7, 14 ou 30 dias")
    filter_role: Optional[str] = Field(default="aluno", description="'aluno' | 'all'")
    manual_student_ids: Optional[List[int]] = Field(default=[], description="IDs dos alunos se filter_type='manual'")
    button_text: Optional[str] = Field(default=None, max_length=100, description="Texto do botão CTA interativo")
    button_url: Optional[str] = Field(default=None, max_length=500, description="URL de destino ou rota interna")
    button_action_type: Optional[str] = Field(default="url", description="'url' | 'course' | 'lesson'")


class BroadcastRecipientItem(BaseModel):
    id: int
    recipient_id: int
    recipient_name: str
    recipient_email: str
    recipient_avatar_url: Optional[str] = None
    status: str  # 'pending' | 'sent' | 'failed'
    is_read: bool = False
    read_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BroadcastCampaignSummary(BaseModel):
    id: int
    title: str
    message: str
    filter_type: str
    filter_target_name: Optional[str] = None
    filter_days: Optional[int] = None
    filter_role: Optional[str] = "aluno"
    button_text: Optional[str] = None
    button_url: Optional[str] = None
    button_action_type: Optional[str] = None
    total_recipients: int
    sent_count: int
    failed_count: int
    read_count: int = 0
    read_percentage: float = 0.0
    delay_seconds: int = 1
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    created_at: Optional[datetime] = None
    created_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BroadcastCampaignDetail(BroadcastCampaignSummary):
    recipients: List[BroadcastRecipientItem] = []
