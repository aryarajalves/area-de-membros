from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ChatMessage(Base):
    """
    Modelo de Mensagem do Chat da Comunidade.
    Suporta canal 'general' (Comunidade Geral) e 'course' (dedicado por curso),
    além de envio de mídias, fixação de mensagens, curtidas e favoritos.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel_type = Column(String(30), default="general", nullable=False, index=True)  # 'general' | 'course' | 'dm'
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    message = Column(Text, nullable=False, default="")
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(50), nullable=True)  # 'image' | 'document' | 'video'
    parent_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=True, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    pinned_at = Column(DateTime(timezone=True), nullable=True)
    pinned_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)
    button_text = Column(String(100), nullable=True)
    button_url = Column(String(500), nullable=True)
    button_action_type = Column(String(30), nullable=True)  # 'url' | 'course' | 'lesson'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    user = relationship("User", foreign_keys=[user_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    pinned_by_user = relationship("User", foreign_keys=[pinned_by_user_id])
    course = relationship("Course", foreign_keys=[course_id])
    parent = relationship("ChatMessage", remote_side=[id], backref="replies")
    likes = relationship("ChatMessageLike", back_populates="message", cascade="all, delete-orphan")
    favorites = relationship("ChatMessageFavorite", back_populates="message", cascade="all, delete-orphan")
    mentions = relationship("ChatMessageMention", back_populates="message", cascade="all, delete-orphan")


class ChatMessageMention(Base):
    """
    Menções a usuários (@usuario) nas mensagens do chat.
    Permite que o usuário marcado consulte e veja onde foi citado.
    """
    __tablename__ = "chat_mentions"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    mentioned_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("ChatMessage", back_populates="mentions")
    mentioned_user = relationship("User", foreign_keys=[mentioned_user_id])


class ChatMessageLike(Base):
    """
    Curtidas em mensagens do chat da comunidade.
    Cada usuário pode curtir apenas 1 vez cada mensagem.
    """
    __tablename__ = "chat_message_likes"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_chat_message_like_user"),
    )

    user = relationship("User", foreign_keys=[user_id])
    message = relationship("ChatMessage", back_populates="likes")


class ChatMessageFavorite(Base):
    """
    Mensagens favoritadas/salvas por cada usuário.
    """
    __tablename__ = "chat_message_favorites"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_chat_message_favorite_user"),
    )

    user = relationship("User", foreign_keys=[user_id])
    message = relationship("ChatMessage", back_populates="favorites")


class ChatChannelReadStatus(Base):
    """
    Rastreamento de leitura por canal e usuário.
    Armazena o ID da última mensagem lida ou timestamp pelo usuário em um canal específico.
    """
    __tablename__ = "chat_channel_read_status"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    channel_id = Column(String(50), nullable=False, index=True)  # 'general', 'course_1', etc.
    last_read_message_id = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "channel_id", name="uq_chat_channel_read_user"),
    )

    user = relationship("User", foreign_keys=[user_id])

