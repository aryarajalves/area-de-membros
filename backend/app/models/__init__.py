# Centraliza o registro de todos os modelos SQLAlchemy da aplicação.
# Isso garante que todos os mappers e relacionamentos (ex: Course -> User, LessonComment -> User)
# sejam devidamente carregados e resolvidos pelo SQLAlchemy em qualquer contexto (API, Worker, Scripts).

from app.models.user import User, Invite
from app.models.course import (
    Course,
    UserCourse,
    Module,
    Lesson,
    LessonVideo,
    LessonComment,
    LessonAttachment,
    LessonProgress,
    LessonRating,
    LessonReport,
    LessonNote,
    QuizQuestion,
    QuizOption,
    QuizSubmission,
)
from app.models.support import SupportTopic, SupportReply, SupportTopicLike
from app.models.chat import ChatMessage
from app.models.testimonial import Testimonial
from app.models.gamification import GamificationPoint
from app.models.webhook import Webhook, WebhookLog
from app.models.backup import BackupSchedule, BackupHistory
from app.models.api_token import ApiToken

__all__ = [
    "User",
    "Invite",
    "Course",
    "UserCourse",
    "Module",
    "Lesson",
    "LessonVideo",
    "LessonComment",
    "LessonAttachment",
    "LessonProgress",
    "LessonRating",
    "LessonReport",
    "LessonNote",
    "QuizQuestion",
    "QuizOption",
    "QuizSubmission",
    "SupportTopic",
    "SupportReply",
    "SupportTopicLike",
    "ChatMessage",
    "Testimonial",
    "GamificationPoint",
    "Webhook",
    "WebhookLog",
    "BackupSchedule",
    "BackupHistory",
    "ApiToken",
]
