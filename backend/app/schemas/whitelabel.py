from typing import Optional
from pydantic import BaseModel, Field


class WhiteLabelConfig(BaseModel):
    platform_name: str = Field(default="Área de Membros", description="Nome personalizado da plataforma")
    login_banner_url: Optional[str] = Field(default=None, description="URL da imagem de banner da tela de login")
    bg_color: str = Field(default="#090d16", description="Cor de fundo global da plataforma")


class WhiteLabelUpdate(BaseModel):
    platform_name: Optional[str] = Field(None, min_length=1, max_length=100)
    login_banner_url: Optional[str] = None
    bg_color: Optional[str] = None
