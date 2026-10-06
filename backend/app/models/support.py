from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SupportTopic(Base):
    __tablename__ = "support_topics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(String(20), default="open")  # 'open', 'resolved', 'closed'
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", foreign_keys=[course_id])
    replies = relationship("SupportReply", back_populates="topic", cascade="all, delete-orphan", order_by="SupportReply.created_at.asc()")
    likes = relationship("SupportTopicLike", back_populates="topic", cascade="all, delete-orphan")
    pins = relationship("SupportTopicPin", back_populates="topic", cascade="all, delete-orphan")
    favorites = relationship("SupportTopicFavorite", back_populates="topic", cascade="all, delete-orphan")


class SupportReply(Base):
    __tablename__ = "support_replies"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("support_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_instructor_reply = Column(Boolean, default=False)
    is_solution = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    topic = relationship("SupportTopic", back_populates="replies")
    user = relationship("User", foreign_keys=[user_id])


class SupportTopicLike(Base):
    __tablename__ = "support_topic_likes"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("support_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    topic = relationship("SupportTopic", back_populates="likes")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("topic_id", "user_id", name="uq_support_topic_like"),
    )


class SupportTopicPin(Base):
    __tablename__ = "support_topic_pins"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("support_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    topic = relationship("SupportTopic", back_populates="pins")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("topic_id", "user_id", name="uq_support_topic_pin"),
    )


class SupportTopicFavorite(Base):
    """
    Dúvidas de suporte favoritadas individualmente pelo usuário.
    Aparecem na aba 'Dúvidas' dos favoritos no cabeçalho superior.
    """
    __tablename__ = "support_topic_favorites"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("support_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    topic = relationship("SupportTopic", back_populates="favorites")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("topic_id", "user_id", name="uq_support_topic_favorite"),
    )


