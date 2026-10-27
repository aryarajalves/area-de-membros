from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título do evento ou mentoria")
    description: Optional[str] = Field(None, description="Descrição detalhada do evento e tópicos abordados")
    start_time: datetime = Field(..., description="Data e horário de início do evento (Horário de Brasília)")
    end_time: Optional[datetime] = Field(None, description="Data e horário previsto de término")
    meeting_url: Optional[str] = Field(None, max_length=1024, description="Link da transmissão ao vivo (Zoom, Meet, YouTube)")
    recording_url: Optional[str] = Field(None, max_length=1024, description="Link da gravação pós-evento")
    thumbnail_url: Optional[str] = Field(None, max_length=1024, description="Thumbnail / Imagem de capa do evento")
    target_type: str = Field("all", description="Público-alvo: 'all' para todos ou 'course' para curso específico")
    course_id: Optional[int] = Field(None, description="ID do curso restrito quando target_type for 'course'")
    is_active: bool = Field(True, description="Indica se o evento está visível e ativo")


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_url: Optional[str] = None
    recording_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    target_type: Optional[str] = None
    course_id: Optional[int] = None
    is_active: Optional[bool] = None


class EventResponse(EventBase):
    id: int
    course_title: Optional[str] = None
    course_sales_page_url: Optional[str] = None
    has_access: bool = True
    is_confirmed: bool = False
    attendees_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
