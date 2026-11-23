from typing import Optional
from pydantic import BaseModel, Field


class WhiteLabelConfig(BaseModel):
    platform_name: str = Field(default="Área de Membros", description="Nome personalizado da plataforma")
    pwa_app_name: Optional[str] = Field(default=None, description="Nome personalizado do aplicativo PWA na tela inicial")
    login_banner_url: Optional[str] = Field(default=None, description="URL da imagem de banner da tela de login")
    logo_url: Optional[str] = Field(default=None, description="URL do logotipo personalizado da plataforma (Sidebar e Cabeçalho)")
    pwa_icon_url: Optional[str] = Field(default=None, description="URL do ícone personalizado do aplicativo PWA")
    logo_size: str = Field(default="medium", description="Tamanho do logotipo personalizado (small, medium, large, xlarge)")
    bg_color: str = Field(default="#090d16", description="Cor de fundo global da plataforma")
    is_astrology_platform: bool = Field(default=False, description="Ativa recursos de Astrologia (Signos Zodiacais)")
    community_feed_students_enabled: bool = Field(default=False, description="Permite que alunos visualizem e publiquem no Feed da Comunidade")
    freelance_enabled: bool = Field(default=True, description="Habilita ou oculta a aba de Vagas & Serviços na plataforma")


class WhiteLabelUpdate(BaseModel):
    platform_name: Optional[str] = Field(None, min_length=1, max_length=100)
    pwa_app_name: Optional[str] = Field(None, max_length=50)
    login_banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    pwa_icon_url: Optional[str] = None
    logo_size: Optional[str] = Field(None, pattern="^(small|medium|large|xlarge)$")
    bg_color: Optional[str] = None
    is_astrology_platform: Optional[bool] = None
    community_feed_students_enabled: Optional[bool] = None
    freelance_enabled: Optional[bool] = None
