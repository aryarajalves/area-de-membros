from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class IntroductionPost(Base):
    __tablename__ = "introduction_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)

    # Mídias e Vídeos
    media_type = Column(String(50), default="none", nullable=False)  # 'none', 'image', 'video', 'youtube', 'vimeo', 'loom'
    media_url = Column(Text, nullable=True)  # URL da foto ou vídeo no storage
    video_embed_url = Column(Text, nullable=True)  # URL externa de YouTube, Vimeo ou Loom

    # Redes Sociais e Networking
    instagram = Column(String(100), nullable=True)
    linkedin = Column(String(255), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)

    # Nicho e Localização
    niche = Column(String(100), nullable=True)  # Área de atuação / profissão
    location = Column(String(100), nullable=True)  # Cidade e Estado

    # Matchmaking de Parcerias
    seeking = Column(Text, nullable=True)  # O que busca na comunidade
    offering = Column(Text, nullable=True)  # Como posso ajudar / O que domino

    # Fixado no topo pelo Admin
    is_pinned = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamentos ORM
    user = relationship("User", foreign_keys=[user_id], primaryjoin="IntroductionPost.user_id == User.id")
    comments = relationship("IntroductionComment", back_populates="post", cascade="all, delete-orphan", order_by="IntroductionComment.created_at.asc()")
    likes = relationship("IntroductionLike", back_populates="post", cascade="all, delete-orphan")


class IntroductionComment(Base):
    __tablename__ = "introduction_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("introduction_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("IntroductionPost", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="IntroductionComment.user_id == User.id")


class IntroductionLike(Base):
    __tablename__ = "introduction_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("introduction_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    reaction_type = Column(String(20), default="like", nullable=False)  # 'like', 'love', 'celebrate', 'insightful', 'fire', 'rocket'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("IntroductionPost", back_populates="likes")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="IntroductionLike.user_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_introduction_post_like"),
    )
