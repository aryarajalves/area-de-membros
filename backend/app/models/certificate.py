from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Certificate(Base):
    """
    Certificado de conclusão de curso emitido para um aluno.
    Possui código único de autenticidade (certificate_code) e dados congelados
    no momento da emissão para fins de auditoria e validação pública por QR Code.
    """
    __tablename__ = "certificates"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_certificate_user_course"),
    )

    id = Column(Integer, primary_key=True, index=True)
    certificate_code = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    student_name = Column(String, nullable=False)
    course_title = Column(String, nullable=False)
    workload_hours = Column(Integer, default=10, nullable=False)
    instructor_name = Column(String, nullable=True)
    issued_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User")
    course = relationship("Course", back_populates="certificates")
