from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ChatBroadcastCampaign(Base):
    """
    Campanha de Disparo em Massa de Mensagens Diretas (DMs) no privado dos alunos.
    Registra os filtros utilizados, contagem de destinatários, duração e status.
    """
    __tablename__ = "chat_broadcast_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    filter_type = Column(String(50), nullable=False, default="all")  # 'all' | 'course' | 'tag' | 'manual' | 'no_course' | 'recent_days'
    filter_course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    filter_tag_id = Column(Integer, ForeignKey("student_tags.id", ondelete="SET NULL"), nullable=True)
    filter_days = Column(Integer, nullable=True)  # 7 | 14 | 30 dias de recência de cadastro
    filter_role = Column(String(30), nullable=True, default="aluno")  # 'aluno' | 'all'
    button_text = Column(String(100), nullable=True)
    button_url = Column(String(500), nullable=True)
    button_action_type = Column(String(30), nullable=True)  # 'url' | 'course' | 'lesson'
    total_recipients = Column(Integer, default=0, nullable=False)
    sent_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    delay_seconds = Column(Integer, default=1, nullable=False)  # 1s conforme exigência de negócio
    status = Column(String(30), default="pending", nullable=False, index=True)  # 'pending' | 'processing' | 'completed' | 'failed'
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relacionamentos
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    filter_course = relationship("Course", foreign_keys=[filter_course_id])
    filter_tag = relationship("StudentTag", foreign_keys=[filter_tag_id])
    recipients = relationship("ChatBroadcastRecipient", back_populates="campaign", cascade="all, delete-orphan")


class ChatBroadcastRecipient(Base):
    """
    Registro individual de entrega de mensagem para cada aluno destinatário da campanha.
    Permite auditoria de:
    - Quem recebeu de fato (status='sent')
    - Quem de fato visualizou/leu a mensagem (read_at / is_read na DM)
    """
    __tablename__ = "chat_broadcast_recipients"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("chat_broadcast_campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), default="pending", nullable=False, index=True)  # 'pending' | 'sent' | 'failed'
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    campaign = relationship("ChatBroadcastCampaign", back_populates="recipients")
    recipient = relationship("User", foreign_keys=[recipient_id])
    message = relationship("ChatMessage", foreign_keys=[message_id])
