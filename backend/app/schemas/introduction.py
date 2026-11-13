from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class IntroductionCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Conteúdo do comentário")


class IntroductionCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    user_name: str
    user_role: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime


class IntroductionPostCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Título da apresentação")
    content: str = Field(..., min_length=5, max_length=20000, description="Texto de apresentação")

    # Mídias e Vídeos
    media_type: Optional[str] = Field("none", description="Tipo de mídia: none, image, video, youtube, vimeo, loom")
    media_url: Optional[str] = Field(None, description="URL da foto ou vídeo no storage")
    video_embed_url: Optional[str] = Field(None, description="URL de vídeo do YouTube, Vimeo ou Loom")

    # Redes Sociais e Networking
    instagram: Optional[str] = Field(None, max_length=100)
    linkedin: Optional[str] = Field(None, max_length=255)
    whatsapp: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=255)

    # Nicho e Localização
    niche: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)

    # Matchmaking de Parcerias
    seeking: Optional[str] = Field(None, description="O que busca na comunidade")
    offering: Optional[str] = Field(None, description="Como posso ajudar / O que domino")


class IntroductionPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    content: Optional[str] = Field(None, min_length=5, max_length=20000)

    media_type: Optional[str] = None
    media_url: Optional[str] = None
    video_embed_url: Optional[str] = None

    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None

    niche: Optional[str] = None
    location: Optional[str] = None

    seeking: Optional[str] = None
    offering: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_example: Optional[bool] = None


class IntroductionPostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    user_role: str
    user_avatar: Optional[str] = None
    user_birth_date: Optional[date] = None
    user_is_online: Optional[bool] = False
    title: str
    content: str
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    my_reaction: Optional[str] = None
    reactions_summary: List[str] = []

    # Mídias
    media_type: str = "none"
    media_url: Optional[str] = None
    video_embed_url: Optional[str] = None

    # Redes e Contato
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None

    # Nicho, Localização e Matchmaking
    niche: Optional[str] = None
    location: Optional[str] = None
    seeking: Optional[str] = None
    offering: Optional[str] = None

    # Destaque
    is_pinned: bool = False
    is_example: bool = False

    last_comment_user_name: Optional[str] = None
    last_comment_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comments: List[IntroductionCommentOut] = []


class IntroductionMediaUploadResponse(BaseModel):
    url: str
    media_type: str
    filename: str


class IntroductionPinResponse(BaseModel):
    id: int
    is_pinned: bool


class IntroductionExampleResponse(BaseModel):
    id: int
    is_example: bool
    is_pinned: bool


class IntroductionLikeRequest(BaseModel):
    reaction_type: Optional[str] = Field("like", description="Tipo de reação: like, love, celebrate, insightful, fire, rocket")


class IntroductionLikeResponse(BaseModel):
    liked: bool
    likes_count: int
    reaction_type: Optional[str] = None
