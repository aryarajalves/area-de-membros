from typing import Optional, List, Any
from pydantic import BaseModel, Field

class AiTutorSettingResponse(BaseModel):
    id: int
    tutor_name: str = "Tutor IA 24h"
    default_monthly_free_questions: int
    system_prompt: Optional[str] = None
    temperature: float = 0.3
    model_name: str = "gpt-4o-mini"
    is_enabled: bool = True
    sales_checkout_url: Optional[str] = None
    monthly_price_brl: float = 10.0
    rag_top_k: int = 4
    rag_min_similarity: float = 0.35
    access_mode: str = "public"
    maintenance_message: Optional[str] = None
    allowed_topics: Optional[str] = None
    prohibited_topics: Optional[str] = None
    redirect_app_url: Optional[str] = None
    redirect_app_name: Optional[str] = None
    prohibited_response_guideline: Optional[str] = None

    model_config = {"from_attributes": True}

class AiTutorSettingUpdate(BaseModel):
    tutor_name: Optional[str] = Field(None, max_length=100)
    default_monthly_free_questions: Optional[int] = Field(None, ge=0, le=1000)
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
    model_name: Optional[str] = None
    is_enabled: Optional[bool] = None
    sales_checkout_url: Optional[str] = None
    monthly_price_brl: Optional[float] = Field(None, ge=0.0)
    rag_top_k: Optional[int] = Field(None, ge=1, le=20)
    rag_min_similarity: Optional[float] = Field(None, ge=0.0, le=1.0)
    access_mode: Optional[str] = Field(None, max_length=30)
    maintenance_message: Optional[str] = None
    allowed_topics: Optional[str] = None
    prohibited_topics: Optional[str] = None
    redirect_app_url: Optional[str] = None
    redirect_app_name: Optional[str] = None
    prohibited_response_guideline: Optional[str] = None

class AiTutorStatusResponse(BaseModel):
    tutor_name: str = "Tutor IA 24h"
    is_active: bool
    is_enabled: bool = True
    access_mode: str = "public"
    is_visible: bool = True
    is_in_maintenance: bool = False
    maintenance_message: Optional[str] = None
    expires_at: Optional[str] = None
    total_monthly_limit: int
    used_this_month: int
    remaining_free: int
    can_ask: bool
    sales_checkout_url: Optional[str] = None
    monthly_price_brl: float = 10.0
    student_cost_this_month_brl: float = 0.0

class AiTutorChatRequest(BaseModel):
    course_id: int
    lesson_id: Optional[int] = None
    message: str = Field(..., min_length=1, max_length=2000)

class AiTutorChatResponse(BaseModel):
    tutor_name: str = "Tutor IA 24h"
    reply: str
    cost_brl: float
    remaining_free: int
    can_ask: bool
    related_lessons: List[Any] = []
    message_id: int
    created_at: str

class AiTutorMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    course_id: int
    lesson_id: Optional[int] = None
    cost_brl: float = 0.0
    related_lessons: Optional[List[Any]] = []
    feedback_rating: Optional[str] = None
    feedback_text: Optional[str] = None
    created_at: str

class AiTutorFeedbackRequest(BaseModel):
    rating: str = Field(..., pattern="^(like|dislike)$") # 'like' ou 'dislike'
    feedback_text: Optional[str] = Field(None, max_length=1500)

class StudentAiTutorUpdate(BaseModel):
    ai_tutor_active: Optional[bool] = None
    ai_tutor_expires_at: Optional[str] = None
    ai_tutor_custom_monthly_limit: Optional[int] = None

class HotmartSubscriptionWebhookPayload(BaseModel):
    event: Optional[str] = None
    data: Optional[dict] = None

class BatchIndexLessonsRequest(BaseModel):
    lesson_ids: List[int] = Field(..., min_length=1)

class KnowledgeChunkResponse(BaseModel):
    id: int
    chunk_index: int
    chunk_type: str = "transcript" # 'transcript' ou 'qa_pair'
    question_text: Optional[str] = None
    answer_text: Optional[str] = None
    content: str
    start_time_seconds: Optional[int] = None
    end_time_seconds: Optional[int] = None
    start_time_str: str = "00:00"
    end_time_str: str = "00:00"
    token_count: int

class SuggestedQuestionsResponse(BaseModel):
    lesson_id: Optional[int] = None
    questions: List[str] = []
    has_custom_qa: bool = False


class AiTutorSuggestionCreate(BaseModel):
    course_id: Optional[int] = None
    lesson_id: Optional[int] = None
    suggestion_text: str = Field(..., min_length=3, max_length=2000)
    category: str = "platform_improvement"

class AiTutorSuggestionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(new|analyzing|implemented|dismissed)$")
    admin_notes: Optional[str] = Field(None, max_length=2000)

class AiTutorSuggestionResponse(BaseModel):
    id: int
    user_id: int
    student_name: str
    student_email: str
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    lesson_id: Optional[int] = None
    lesson_title: Optional[str] = None
    suggestion_text: str
    category: str = "platform_improvement"
    status: str = "new"
    admin_notes: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}
