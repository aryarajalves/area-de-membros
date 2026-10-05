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
    channel_type = Column(String(30), default="general", nullable=False, index=True)  # 'general' | 'course'
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False, default="")
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(50), nullable=True)  # 'image' | 'document' | 'video'
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    pinned_at = Column(DateTime(timezone=True), nullable=True)
    pinned_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    user = relationship("User", foreign_keys=[user_id])
    pinned_by_user = relationship("User", foreign_keys=[pinned_by_user_id])
    course = relationship("Course", foreign_keys=[course_id])
    likes = relationship("ChatMessageLike", back_populates="message", cascade="all, delete-orphan")
    favorites = relationship("ChatMessageFavorite", back_populates="message", cascade="all, delete-orphan")


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

