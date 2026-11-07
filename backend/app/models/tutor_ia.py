from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class AiTutorSetting(Base):
    """
    Configurações globais do Tutor IA da Área de Membros.
    Permite customizar o Prompt de Sistema, cota de degustação, temperatura, checkout e precificação.
    """
    __tablename__ = "ai_tutor_settings"

    id = Column(Integer, primary_key=True, index=True)
    tutor_name = Column(String(100), default="Tutor IA 24h", nullable=False)
    default_monthly_free_questions = Column(Integer, default=3, nullable=False)
    system_prompt = Column(Text, nullable=True)
    temperature = Column(Float, default=0.3, nullable=False)
    model_name = Column(String, default="gpt-4o-mini", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    sales_checkout_url = Column(String, nullable=True)
    monthly_price_brl = Column(Float, default=10.0, nullable=False)
    rag_top_k = Column(Integer, default=4, nullable=False)
    rag_min_similarity = Column(Float, default=0.35, nullable=False)
    access_mode = Column(String(30), default="public", nullable=False) # 'public', 'maintenance', 'private_team', 'disabled'
    maintenance_message = Column(Text, nullable=True)
    allowed_topics = Column(Text, nullable=True)
    prohibited_topics = Column(Text, nullable=True)
    redirect_app_url = Column(String(500), nullable=True)
    redirect_app_name = Column(String(150), nullable=True)
    prohibited_response_guideline = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class AiTutorMessage(Base):
    """
    Histórico de mensagens trocadas entre alunos e o Tutor IA.
    Registra métricas precisas de tokens e custos para rastreabilidade financeira por aluno.
    """
    __tablename__ = "ai_tutor_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    role = Column(String, nullable=False) # 'user' ou 'assistant'
    content = Column(Text, nullable=False)
    prompt_tokens = Column(Integer, nullable=True, default=0)
    completion_tokens = Column(Integer, nullable=True, default=0)
    cost_brl = Column(Float, default=0.0, nullable=False)
    related_lessons_json = Column(Text, nullable=True) # JSON com [{course_id, module_id, lesson_id, title, timestamp_seconds}]
    feedback_rating = Column(String(10), nullable=True) # 'like' ou 'dislike'
    feedback_text = Column(Text, nullable=True)         # justificativa opcional no dislike
    feedback_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User")
    course = relationship("Course")
    lesson = relationship("Lesson")


class AiKnowledgeChunk(Base):
    """
    Fragmento de texto de uma aula indexado com vetor de embedding (RAG Vetorial).
    Permite busca semântica em tempo real em todas as aulas da plataforma.
    """
    __tablename__ = "ai_knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0, nullable=False)
    chunk_type = Column(String(30), default="transcript", nullable=False) # 'transcript' ou 'qa_pair'
    question_text = Column(Text, nullable=True) # Pergunta sintética gerada para a aula
    answer_text = Column(Text, nullable=True)   # Resposta sintética correspondente
    content = Column(Text, nullable=False)
    start_time_seconds = Column(Integer, nullable=True) # segundo inicial no vídeo
    end_time_seconds = Column(Integer, nullable=True)   # segundo final no vídeo
    embedding_json = Column(Text, nullable=False)       # JSON com lista de 1536 floats normalizados
    token_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    course = relationship("Course")
    module = relationship("Module")
    lesson = relationship("Lesson")


class AiTutorSuggestion(Base):
    """
    Sugestões e feedbacks de melhorias da plataforma coletados pelo Tutor IA.
    """
    __tablename__ = "ai_tutor_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    suggestion_text = Column(Text, nullable=False)
    category = Column(String(50), default="platform_improvement", nullable=False)
    status = Column(String(30), default="new", nullable=False) # 'new', 'analyzing', 'implemented', 'dismissed'
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User")
    course = relationship("Course")
    lesson = relationship("Lesson")

