from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class CourseUpsellOffer(Base):
    """
    Configuração de anúncios e ofertas de Upsell/Cross-sell por progresso de curso.
    Exibido para o aluno ao atingir uma porcentagem definida de conclusão do curso,
    caso o aluno ainda não possua o curso ou ferramenta alvo.
    """
    __tablename__ = "course_upsell_offers"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    target_course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    progress_pct = Column(Integer, nullable=False, default=35, index=True)  # ex: 35, 50, 75
    media_type = Column(String(20), default="image", nullable=False)  # 'image' ou 'video'
    media_url = Column(Text, nullable=False)  # URL da imagem ou vídeo promocional
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    button_text = Column(String(100), default="Quero Conhecer", nullable=False)
    button_url = Column(Text, nullable=True)  # Se nulo, utiliza o sales_page_url do target_course
    is_active = Column(Boolean, default=True, nullable=False)
    show_in_sidebar = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    course = relationship("Course", foreign_keys=[course_id], backref=backref("upsell_offers", cascade="all, delete-orphan"))
    target_course = relationship("Course", foreign_keys=[target_course_id])


class CourseUpsellView(Base):
    """
    Rastreia exibições de anúncios de Upsell por aluno para garantir que
    cada oferta seja exibida apenas 1 única vez para o mesmo aluno.
    """
    __tablename__ = "course_upsell_views"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("course_upsell_offers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    viewed_at = Column(DateTime, default=utc_now, nullable=False)
    dismissed = Column(Boolean, default=True, nullable=False)
    clicked_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("offer_id", "user_id", name="uq_course_upsell_view_user"),
    )

    offer = relationship("CourseUpsellOffer", backref=backref("views", cascade="all, delete-orphan"))
    user = relationship("User")
