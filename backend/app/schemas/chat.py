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
    unread_count: int = 0


class ChatUnreadSummaryResponse(BaseModel):
    total_unread: int = 0
    channel_unread: int = 0
    dm_unread: int = 0
    mentions_unread: int = 0


class ChatMessageResponse(BaseModel):
    id: int
    channel_type: str
    course_id: Optional[int] = None
    parent_id: Optional[int] = None
    recipient_id: Optional[int] = None
    message: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_pinned: bool = False
    pinned_at: Optional[datetime] = None
    pinned_by_user_id: Optional[int] = None
    is_read: bool = False
    button_text: Optional[str] = None
    button_url: Optional[str] = None
    button_action_type: Optional[str] = None
    likes_count: int = 0
    liked_by_me: bool = False
    is_favorited: bool = False
    reply_count: int = 0
    created_at: datetime
    user: ChatUser
    recipient: Optional[ChatUser] = None
    can_delete: bool = False

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    channel_type: str = Field(default="general", description="'general', 'course' ou 'dm'")
    course_id: Optional[int] = Field(default=None, description="ID do curso se channel_type for 'course'")
    parent_id: Optional[int] = Field(default=None, description="ID da mensagem pai caso seja resposta em thread")
    recipient_id: Optional[int] = Field(default=None, description="ID do usuário destinatário para mensagens diretas (DM)")
    message: Optional[str] = Field(default="", max_length=3000, description="Conteúdo da mensagem")
    media_url: Optional[str] = Field(default=None, description="URL da mídia anexada (imagem, áudio, doc)")
    media_type: Optional[str] = Field(default=None, description="Tipo da mídia: image, document, audio, video")
    button_text: Optional[str] = Field(default=None, max_length=100, description="Texto do botão CTA interativo")
    button_url: Optional[str] = Field(default=None, max_length=500, description="URL de destino ou rota interna")
    button_action_type: Optional[str] = Field(default="url", description="'url' | 'course' | 'lesson'")


class ChatDmConversationItem(BaseModel):
    contact: ChatUser
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0


class ChatMentionNotificationItem(BaseModel):
    id: int
    message_id: int
    channel_type: str
    course_id: Optional[int] = None
    message_text: str
    sender: ChatUser
    created_at: datetime
    is_read: bool


class ChatNotificationItem(BaseModel):
    id: int
    type: str  # 'mention' | 'thread_reply'
    message_id: int
    parent_id: Optional[int] = None
    channel_type: str
    course_id: Optional[int] = None
    message_text: str
    sender: ChatUser
    created_at: datetime
    is_read: bool


class ChatNotificationCountsResponse(BaseModel):
    inbox: int = 0
    mentions: int = 0
    threads: int = 0
    total_unread: int = 0


class ChatMentionContactItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None


class ChatMessageLikeToggleResponse(BaseModel):
    message_id: int
    likes_count: int
    liked_by_me: bool
    liked: bool = False


class ChatMessageFavoriteToggleResponse(BaseModel):
    message_id: int
    is_favorited: bool
    favorited: bool = False

