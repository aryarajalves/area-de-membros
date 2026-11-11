from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class CommunityStory(Base):
    __tablename__ = "community_stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = Column(String(500), nullable=False)
    media_type = Column(String(20), nullable=False, default="image")  # "image" ou "video"
    media_thumbnail_url = Column(String(500), nullable=True)
    caption = Column(String(500), nullable=True)
    duration_seconds = Column(Integer, default=5, nullable=False)
    is_highlight = Column(Boolean, default=False, nullable=False)
    highlight_title = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)

    # Relacionamentos
    user = relationship("User", backref="stories", lazy="joined")
    views = relationship("CommunityStoryView", back_populates="story", cascade="all, delete-orphan")
    reactions = relationship("CommunityStoryReaction", back_populates="story", cascade="all, delete-orphan")


class CommunityStoryView(Base):
    __tablename__ = "community_story_views"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("community_stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("story_id", "user_id", name="uq_story_user_view"),
    )

    story = relationship("CommunityStory", back_populates="views")
    user = relationship("User", lazy="joined")


class CommunityStoryReaction(Base):
    __tablename__ = "community_story_reactions"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("community_stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reaction_type = Column(String(30), nullable=False)  # "fire", "heart", "clap", "laugh", "rocket"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    story = relationship("CommunityStory", back_populates="reactions")
    user = relationship("User", lazy="joined")
