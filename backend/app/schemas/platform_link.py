from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


class PlatformLinkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Título exibido do link (ex: Instagram, YouTube)")
    url: str = Field(..., min_length=1, max_length=500, description="URL de destino (ex: https://instagram.com/seu_perfil)")
    icon: Optional[str] = Field("link", max_length=50, description="Ícone representativo (instagram, youtube, whatsapp, etc.)")
    order_index: Optional[int] = Field(0, description="Ordem de exibição na barra lateral")
    is_active: Optional[bool] = Field(True, description="Se o link está ativo e visível na barra lateral")


class PlatformLinkCreate(PlatformLinkBase):
    pass


class PlatformLinkUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    url: Optional[str] = Field(None, min_length=1, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class PlatformLinkResponse(PlatformLinkBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

