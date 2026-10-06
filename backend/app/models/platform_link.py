from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.core.database import Base


class PlatformLink(Base):
    __tablename__ = "platform_links"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    icon = Column(String(50), default="link")  # instagram, youtube, whatsapp, telegram, globe, link, etc.
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
