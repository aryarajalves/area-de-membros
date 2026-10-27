from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    meeting_url = Column(String(1024), nullable=True)
    recording_url = Column(String(1024), nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    target_type = Column(String(20), default="all", nullable=False)  # 'all' ou 'course'
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    course = relationship("Course", foreign_keys=[course_id], lazy="joined")


class EventAttendee(Base):
    """
    Registra a confirmação de presença / inscrição do aluno em um evento ou mentoria.
    Permite acionar automações e funis específicos no momento da confirmação.
    """
    __tablename__ = "event_attendees"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    confirmed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_attendance"),
    )

    event = relationship("Event", foreign_keys=[event_id], backref="attendees")
    user = relationship("User", foreign_keys=[user_id])

