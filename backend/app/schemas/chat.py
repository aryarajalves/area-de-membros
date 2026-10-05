from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class ChatUser(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChatChannelItem(BaseModel):
    id: str
    name: str
    type: str  # 'general' | 'course'
    course_id: Optional[int] = None
    description: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None


class ChatMessageResponse(BaseModel):
    id: int
    channel_type: str
    course_id: Optional[int] = None
    message: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_pinned: bool = False
    pinned_at: Optional[datetime] = None
    pinned_by_user_id: Optional[int] = None
    likes_count: int = 0
    liked_by_me: bool = False
    is_favorited: bool = False
    created_at: datetime
    user: ChatUser
    can_delete: bool = False

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    channel_type: str = Field(default="general", description="'general' para comunidade geral ou 'course' para canal do curso")
    course_id: Optional[int] = Field(default=None, description="ID do curso se channel_type for 'course'")
    message: Optional[str] = Field(default="", max_length=3000, description="Conteúdo da mensagem")
    media_url: Optional[str] = Field(default=None, description="URL da mídia anexada (imagem, áudio, doc)")
    media_type: Optional[str] = Field(default=None, description="Tipo da mídia: image, document, audio, video")


class ChatMessageLikeToggleResponse(BaseModel):
    message_id: int
    likes_count: int
    liked_by_me: bool
    liked: bool = False


class ChatMessageFavoriteToggleResponse(BaseModel):
    message_id: int
    is_favorited: bool
    favorited: bool = False

