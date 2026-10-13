from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamentos ORM
    post = relationship("IntroductionPost", back_populates="likes")
    user = relationship("User", foreign_keys=[user_id], primaryjoin="IntroductionLike.user_id == User.id")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_introduction_post_like"),
    )
