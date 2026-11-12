from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=True, index=True)
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, nullable=True)  # Lista de URLs de imagens/vídeos
    media_type = Column(String(50), default="none", nullable=False)  # 'none', 'image', 'video', 'carousel'
    media_thumbnail_url = Column(Text, nullable=True)  # Imagem de capa (poster) para posts com vídeo
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    bookmarks_count = Column(Integer, default=0, nullable=False)
    shares_count = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)

    # Melhorias: Categorias, Enquetes e Conquistas
    category = Column(String(50), default="geral", nullable=False, index=True)  # 'geral', 'vitoria', 'duvida', 'dica', 'aviso', 'networking'
    location = Column(String(100), nullable=True)  # Ex: 'São Paulo, SP'
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)  # Data e hora programada para publicação
    is_scheduled = Column(Boolean, default=False, nullable=False, index=True)  # True enquanto aguarda a data de disparo
    poll_question = Column(String(255), nullable=True)  # Pergunta da enquete
    poll_options = Column(JSON, nullable=True)  # Lista de opções da enquete [{"id": 1, "text": "Opção A", "votes": 0}]
    achievement_type = Column(String(50), nullable=True)  # 'certificate', 'lesson_completed', 'level_up'
    achievement_data = Column(JSON, nullable=True)  # Dados da conquista celebrada

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamentos ORM
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityPost.user_id == User.id")
    course = relationship("Course", foreign_keys=[course_id], primaryjoin="CommunityPost.course_id == Course.id")
    comments = relationship(
        "CommunityPostComment",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="CommunityPostComment.created_at.asc()"
    )
    likes = relationship("CommunityPostLike", back_populates="post", cascade="all, delete-orphan")
    bookmarks = relationship("CommunityPostBookmark", back_populates="post", cascade="all, delete-orphan")
    views = relationship("CommunityPostView", back_populates="post", cascade="all, delete-orphan")
    poll_votes = relationship("CommunityPostPollVote", back_populates="post", cascade="all, delete-orphan")
    reports = relationship("CommunityPostReport", back_populates="post", cascade="all, delete-orphan")


class CommunityPostComment(Base):
    __tablename__ = "community_post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("community_post_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    media_type = Column(String(50), default="text", nullable=False)  # 'text', 'audio', 'gif', 'image'
    media_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("CommunityPost", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityPostComment.user_id == User.id")


class CommunityPostLike(Base):
    __tablename__ = "community_post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("CommunityPost", back_populates="likes")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityPostLike.user_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_community_post_like"),
    )


class CommunityPostBookmark(Base):
    __tablename__ = "community_post_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("CommunityPost", back_populates="bookmarks")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityPostBookmark.user_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_community_post_bookmark"),
    )


class CommunityNotification(Base):
    __tablename__ = "community_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    notification_type = Column(String(50), nullable=False, index=True)  # 'feed_like', 'feed_comment', 'feed_mention'
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=True, index=True)
    comment_id = Column(Integer, ForeignKey("community_post_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityNotification.user_id == User.id")
    actor = relationship("User", foreign_keys=[actor_id], primaryjoin="CommunityNotification.actor_id == User.id")
    post = relationship("CommunityPost", foreign_keys=[post_id], primaryjoin="CommunityNotification.post_id == CommunityPost.id")


class CommunityFollow(Base):
    __tablename__ = "community_follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    follower = relationship("User", foreign_keys=[follower_id], primaryjoin="CommunityFollow.follower_id == User.id")
    following = relationship("User", foreign_keys=[following_id], primaryjoin="CommunityFollow.following_id == User.id")

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_community_follow"),
    )


class CommunityPostView(Base):
    __tablename__ = "community_post_views"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("CommunityPost", back_populates="views")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityPostView.user_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_community_post_view"),
    )


class CommunityPostPollVote(Base):
    __tablename__ = "community_post_poll_votes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CommunityPost", back_populates="poll_votes")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityPostPollVote.user_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_community_post_poll_vote"),
    )


class CommunityPostReport(Base):
    __tablename__ = "community_post_reports"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(255), nullable=False)  # 'spam', 'ofensivo', 'conteudo_inapropriado', 'outro'
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # 'pending', 'resolved', 'dismissed'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("CommunityPost", back_populates="reports")
    reporter = relationship("User", foreign_keys=[reporter_id], primaryjoin="CommunityPostReport.reporter_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "reporter_id", name="uq_community_post_report"),
    )


class CommunityStrike(Base):
    __tablename__ = "community_strikes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    moderator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="SET NULL"), nullable=True, index=True)
    comment_id = Column(Integer, ForeignKey("community_post_comments.id", ondelete="SET NULL"), nullable=True, index=True)
    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    strike_number = Column(Integer, default=1, nullable=False)
    appeal_status = Column(String(50), default="none", nullable=False, index=True)  # 'none', 'pending', 'approved', 'rejected'
    appeal_reason = Column(Text, nullable=True)
    appeal_reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    appeal_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id], primaryjoin="CommunityStrike.user_id == User.id")
    moderator = relationship("User", foreign_keys=[moderator_id], primaryjoin="CommunityStrike.moderator_id == User.id")
    post = relationship("CommunityPost", foreign_keys=[post_id], primaryjoin="CommunityStrike.post_id == CommunityPost.id")




