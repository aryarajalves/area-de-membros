from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class GamificationPoint(Base):
    """
    Registro de pontuação de gamificação para alunos.
    Armazena pontos ganhos por ações (Melhor Solução, respostas no suporte, conclusão de aulas, mensagens no chat com limite diário, comentários).
    """
    __tablename__ = "gamification_points"
    __test__ = False

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    reference_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relacionamento
    user = relationship("User", foreign_keys=[user_id])
