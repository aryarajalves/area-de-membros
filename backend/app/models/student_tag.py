from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudentTag(Base):
    """
    Etiquetas para categorização e segmentação de alunos.
    Permite filtrar alunos na gestão e segmentar disparos em massa.
    """
    __tablename__ = "student_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    color = Column(String(20), nullable=False, default="#3b82f6")  # Hexadecimal
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    assignments = relationship("StudentTagAssignment", back_populates="tag", cascade="all, delete-orphan")


class StudentTagAssignment(Base):
    """
    Associação N-para-N entre alunos (User) e etiquetas (StudentTag).
    """
    __tablename__ = "student_tag_assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("student_tags.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "tag_id", name="uq_student_tag_assignment"),
    )

    # Relacionamentos
    student = relationship("User", foreign_keys=[student_id])
    tag = relationship("StudentTag", back_populates="assignments", foreign_keys=[tag_id])
