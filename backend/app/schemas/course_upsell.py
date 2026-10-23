from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CourseUpsellOfferBase(BaseModel):
    target_course_id: int = Field(..., description="ID do curso ou ferramenta da plataforma a ser promovido")
    progress_pct: int = Field(..., ge=1, le=100, description="Porcentagem de progresso no curso em que o anúncio deve disparar (1 a 100)")
    media_type: str = Field("image", description="Tipo de mídia: 'image' ou 'video'")
    media_url: str = Field(..., description="URL da imagem (banner) ou do vídeo promocional")
    title: str = Field(..., min_length=1, max_length=255, description="Título da oferta/anúncio")
    description: Optional[str] = Field(None, description="Texto persuasivo ou explicação do próximo curso")
    button_text: str = Field("Quero Conhecer", max_length=100, description="Texto do botão de ação")
    button_url: Optional[str] = Field(None, description="Link do checkout ou página externa (se nulo, usa a sales_page_url do target)")
    is_active: bool = Field(True, description="Se a oferta está ativa para exibição")
    show_in_sidebar: bool = Field(False, description="Exibir card da oferta de próximo nível na barra lateral da sala de aula")

class CourseUpsellOfferCreate(CourseUpsellOfferBase):
    pass

class CourseUpsellOfferUpdate(BaseModel):
    target_course_id: Optional[int] = None
    progress_pct: Optional[int] = Field(None, ge=1, le=100)
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    button_text: Optional[str] = None
    button_url: Optional[str] = None
    is_active: Optional[bool] = None
    show_in_sidebar: Optional[bool] = None

class CourseUpsellOfferResponse(CourseUpsellOfferBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime
    target_course_title: Optional[str] = None
    target_course_thumbnail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CourseUpsellEligibleResponse(BaseModel):
    has_offer: bool
    offer: Optional[CourseUpsellOfferResponse] = None
    target_action_url: Optional[str] = None
