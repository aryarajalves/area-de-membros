from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Funnel(Base):
    """
    Modelo de Funil de Mensagens / Fluxo Visual.
    Armazena o nome, configurações de gatilho e o JSON do canvas (nós, posições e conexões).
    """
    __tablename__ = "funnels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), default="chat_button", nullable=False)
    trigger_keywords = Column(String(500), nullable=True)
    flow_data = Column(Text, nullable=False, default="{}")
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamentos
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    executions = relationship("FunnelExecution", back_populates="funnel", cascade="all, delete-orphan")


class FunnelExecution(Base):
    """
    Histórico de execução de um funil para um usuário/aluno específico.
    """
    __tablename__ = "funnel_executions"

    id = Column(Integer, primary_key=True, index=True)
    funnel_id = Column(Integer, ForeignKey("funnels.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_by = Column(String(50), default="chat_button", nullable=False)
    current_node_id = Column(String(100), nullable=True)
    status = Column(String(50), default="completed", nullable=False)  # running, completed, failed
    started_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    logs = Column(Text, nullable=True)

    # Relacionamentos
    funnel = relationship("Funnel", back_populates="executions")
    user = relationship("User", foreign_keys=[user_id])
