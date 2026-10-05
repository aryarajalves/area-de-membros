import json
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime

# --- Schemas de Comentários de Aula (Lesson Comments) ---
class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CommentResponse(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    parent_id: Optional[int] = None
    content: str
    likes_count: int = 0
    liked_by_me: bool = False
    created_at: datetime
    updated_at: datetime
    user: Optional[CommentUserResponse] = None
    replies: Optional[List["CommentResponse"]] = []

    model_config = ConfigDict(from_attributes=True)

CommentResponse.model_rebuild()

class CommentLikeToggleResponse(BaseModel):
    comment_id: int
    likes_count: int
    liked_by_me: bool
    liked: bool = False



# --- Schemas de Vídeos Multilíngues (Lesson Videos) ---
class LessonVideoBase(BaseModel):
    language: str = "pt"
    language_label: str = "Português"
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: str
    video_type: Optional[str] = "upload"

class LessonVideoCreate(LessonVideoBase):
    pass

class LessonVideoResponse(LessonVideoBase):
    id: int
    lesson_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Anexos / Materiais Complementares (Lesson Attachments) ---
class LessonAttachmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_url: str
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None

class LessonAttachmentCreate(LessonAttachmentBase):
    pass

class LessonAttachmentResponse(LessonAttachmentBase):
    id: int
    lesson_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Aulas (Lessons) ---
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_type: Optional[str] = "upload"  # 'upload', 'url', 'youtube', 'vimeo'
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    order_index: Optional[int] = 0
    availability_status: Optional[str] = "available"  # 'available', 'coming_soon'
    content_type: Optional[str] = "video"  # 'video', 'text', 'quiz'
    text_content: Optional[str] = None
    passing_score_pct: Optional[int] = 70

class LessonCreate(LessonBase):
    videos: Optional[List[LessonVideoCreate]] = None
    attachments: Optional[List[LessonAttachmentCreate]] = None

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_type: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    order_index: Optional[int] = None
    availability_status: Optional[str] = None
    content_type: Optional[str] = None
    text_content: Optional[str] = None
    passing_score_pct: Optional[int] = None
    videos: Optional[List[LessonVideoCreate]] = None
    attachments: Optional[List[LessonAttachmentCreate]] = None

class LessonResponse(LessonBase):
    id: int
    module_id: int
    created_at: datetime
    updated_at: datetime
    videos: List[LessonVideoResponse] = []
    attachments: List[LessonAttachmentResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Módulos (Modules) ---
class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    order_index: Optional[int] = 0

class ModuleCreate(ModuleBase):
    pass

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    order_index: Optional[int] = None

class ModuleResponse(ModuleBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ModuleDetailResponse(ModuleResponse):
    lessons: List[LessonResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Cursos (Courses) ---
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    bg_color: Optional[str] = "#090d16"
    is_published: bool = True
    sales_page_url: Optional[str] = None
    order_index: Optional[int] = 0

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    bg_color: Optional[str] = None
    is_published: Optional[bool] = None
    sales_page_url: Optional[str] = None
    order_index: Optional[int] = None

class CourseResponse(CourseBase):
    id: int
    has_access: Optional[bool] = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CourseDetailResponse(CourseResponse):
    modules: List[ModuleDetailResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Interações da Aula (Progresso, Avaliações e Relato de Problemas) ---
class LessonProgressUpdate(BaseModel):
    is_completed: bool = True

class LessonProgressResponse(BaseModel):
    lesson_id: int
    user_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CourseProgressResponse(BaseModel):
    course_id: int
    completed_lesson_ids: List[int] = []

class LessonRatingUpdate(BaseModel):
    rating: int  # 0 a 5 (0 para remover avaliação)

class LessonRatingResponse(BaseModel):
    lesson_id: int
    user_rating: int = 0
    average_rating: float = 0.0
    total_ratings: int = 0

class LessonReportCreate(BaseModel):
    issue_type: str  # 'video', 'audio', 'material', 'content', 'other'
    description: str

class LessonReportUpdate(BaseModel):
    status: str  # 'open', 'resolved'

class LessonReportResponse(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    issue_type: str
    description: str
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    lesson_title: Optional[str] = None
    course_id: Optional[int] = None
    course_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class LessonReportsCountResponse(BaseModel):
    pending_count: int = 0
    resolved_count: int = 0
    total_count: int = 0


# --- Schemas de Anotações Pessoais da Aula (Lesson Notes) ---
class LessonNoteCreate(BaseModel):
    content: str

class LessonNoteUpdate(BaseModel):
    content: str

class LessonNoteResponse(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    content: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Configuração Global de Tema da Área de Membros ---
class PlatformThemeUpdate(BaseModel):
    bg_color: str = "#090d16"

class PlatformThemeResponse(BaseModel):
    bg_color: str = "#090d16"


# --- Schemas de Upload Direto para Nuvem (Presigned URL Backblaze B2) ---
class VideoUploadUrlRequest(BaseModel):
    filename: str
    content_type: Optional[str] = "video/mp4"

class VideoUploadUrlResponse(BaseModel):
    direct_upload: bool
    upload_url: str
    video_url: Optional[str] = None
    final_url: Optional[str] = None
    method: Optional[str] = None

# --- Schemas de Transcrição e Resumo IA da Aula (OpenAI Whisper & GPT) ---
class LessonTranscriptionResponse(BaseModel):
    id: int
    lesson_id: int
    full_transcript: str
    summary_html: Optional[str] = None
    summary_markdown: Optional[str] = None
    key_takeaways: Optional[List[str]] = None
    status: str = "ready"
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('key_takeaways', mode='before')
    @classmethod
    def parse_key_takeaways(cls, v):
        if isinstance(v, str):
            if not v.strip():
                return []
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
                return [str(parsed)]
            except Exception:
                return [v]
        return v or []

    model_config = ConfigDict(from_attributes=True)


class LessonTranscriptionTriggerRequest(BaseModel):
    language: Optional[str] = "pt"
    video_url: Optional[str] = None  # Se informado, usa essa URL específica; caso contrário usa o vídeo padrão da aula




