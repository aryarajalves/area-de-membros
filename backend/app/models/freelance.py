from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class FreelanceJob(Base):
    """Vaga ou oportunidade de contratação de freelancer publicada na área de membros."""

    __tablename__ = "freelance_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(60), nullable=False, index=True)
    budget_type = Column(String(20), nullable=False, default="negotiable")  # fixed | hourly | negotiable
    budget_value = Column(String(60), nullable=True)
    deadline = Column(String(100), nullable=True)
    contact_whatsapp = Column(String(30), nullable=True)
    status = Column(String(20), nullable=False, default="open", index=True)  # open | closed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    author = relationship("User", foreign_keys=[user_id])
