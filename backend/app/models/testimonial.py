from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Testimonial(Base):
    """
    Modelo de Depoimento / Avaliação do Curso.
    Alunos avaliam cursos aos quais possuem acesso com nota (1 a 5 estrelas), título e relato.
    Administradores moderam aprovando/rejeitando/destacando os depoimentos.
    Restrição: Permite apenas 1 depoimento por curso por usuário.
    """
    __tablename__ = "testimonials"
    __test__ = False

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False, default=5)  # 1 a 5 estrelas
    title = Column(String(200), nullable=True)  # Título resumido do depoimento
    content = Column(Text, nullable=False)  # Texto do depoimento
    status = Column(String(30), default="pending", nullable=False, index=True)  # 'pending' | 'approved' | 'rejected'
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_testimonials_user_course"),
    )

    # Relacionamentos
    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", foreign_keys=[course_id])

