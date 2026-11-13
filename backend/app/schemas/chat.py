from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class ChatUser(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    gamification_points: Optional[int] = 0
    gamification_tier: Optional[str] = None
    gamification_level_title: Optional[str] = None
    gamification_tier_color: Optional[str] = None
    gamification_badge: Optional[str] = None

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
    is_locked: bool = False
    locked_until: Optional[datetime] = None
    locked_reason: Optional[str] = None
    dm_locked: bool = False
    dm_locked_until: Optional[datetime] = None
    dm_locked_reason: Optional[str] = None


class ChatUnreadSummaryResponse(BaseModel):
    total_unread: int = 0
    channel_unread: int = 0
    dm_unread: int = 0
    mentions_unread: int = 0


class ChatMessageReactionSummary(BaseModel):
    emoji: str
    count: int = 0
    reacted_by_me: bool = False
    users: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    id: int
    channel_type: str
    course_id: Optional[int] = None
    parent_id: Optional[int] = None
    recipient_id: Optional[int] = None
    dm_thread_admin_id: Optional[int] = None
    message: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_pinned: bool = False
    pinned_at: Optional[datetime] = None
    pinned_by_user_id: Optional[int] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
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
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_user_id: Optional[int] = None
    reactions: List[ChatMessageReactionSummary] = []

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    channel_type: str = Field(default="general", description="'general', 'course' ou 'dm'")
    course_id: Optional[int] = Field(default=None, description="ID do curso se channel_type for 'course'")
    parent_id: Optional[int] = Field(default=None, description="ID da mensagem pai caso seja resposta em thread")
    recipient_id: Optional[int] = Field(default=None, description="ID do usuário destinatário para mensagens diretas (DM)")
    dm_thread_admin_id: Optional[int] = Field(default=None, description="ID do administrador quando o superadmin responde em thread de atendimento")
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


class ChatAdminDmConversationItem(BaseModel):
    student: ChatUser
    admin: ChatUser
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_by_admin: int = 0
    total_messages: int = 0


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


class ChatMemberItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[datetime] = None
    is_online: bool = False

    model_config = ConfigDict(from_attributes=True)


class ChatChannelMembersResponse(BaseModel):
    channel_type: str
    course_id: Optional[int] = None
    channel_name: Optional[str] = None
    total_members: int = 0
    superadmins: List[ChatMemberItem] = []
    admins: List[ChatMemberItem] = []
    students: List[ChatMemberItem] = []


class ChatDmCandidateItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen_at: Optional[datetime] = None
    level: int = 1
    level_title: str = "Bronze I"
    level_tier: str = "Bronze"
    total_points: int = 0
    course_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class ChatDmCandidatesResponse(BaseModel):
    items: List[ChatDmCandidateItem]
    total: int
    page: int
    limit: int
    pages: int


class ChatMessageReactionToggleRequest(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=20, description="Emoji da reação (ex: 👍, ❤️, 😂, etc.)")


class ChatMessageReactionToggleResponse(BaseModel):
    message_id: int
    emoji: str
    action: str  # 'added' | 'removed' | 'switched'
    reactions: List[ChatMessageReactionSummary] = []
    contact_id: Optional[int] = None


class ChatDmMarkStatusResponse(BaseModel):
    success: bool
    contact_id: int
    marked_count: int
    is_read: bool


