# Centraliza o registro de todos os modelos SQLAlchemy da aplicação.
# Isso garante que todos os mappers e relacionamentos (ex: Course -> User, LessonComment -> User)
# sejam devidamente carregados e resolvidos pelo SQLAlchemy em qualquer contexto (API, Worker, Scripts).

from app.models.user import User, Invite, PasswordResetToken, RegistrationVerification
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
    LessonFavorite,
    LessonCommentFavorite,
    CourseSalesClick,
)
from app.models.course_upsell import CourseUpsellOffer, CourseUpsellView
from app.models.support import SupportTopic, SupportReply, SupportTopicLike, SupportTopicPin, SupportTopicFavorite
from app.models.chat import ChatMessage
from app.models.testimonial import Testimonial
from app.models.gamification import GamificationPoint
from app.models.webhook import Webhook, WebhookLog
from app.models.backup import BackupSchedule, BackupHistory
from app.models.api_token import ApiToken
from app.models.platform_link import PlatformLink
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.models.chat_broadcast import ChatBroadcastCampaign, ChatBroadcastRecipient
from app.models.funnel import Funnel, FunnelExecution
from app.models.tutorial import Tutorial
from app.models.introduction import IntroductionPost, IntroductionComment, IntroductionLike
from app.models.community_feed import (
    CommunityPost,
    CommunityPostComment,
    CommunityPostLike,
    CommunityPostBookmark,
    CommunityNotification,
    CommunityFollow,
    CommunityPostView,
    CommunityPostPollVote,
    CommunityPostReport,
    CommunityStrike,
)
from app.models.community_stories import (
    CommunityStory,
    CommunityStoryView,
    CommunityStoryReaction,
)
from app.models.event import Event, EventAttendee
from app.models.certificate import Certificate
from app.models.tutor_ia import AiTutorSetting, AiTutorMessage, AiKnowledgeChunk, AiTutorSuggestion

__all__ = [
    "User",
    "Invite",
    "PasswordResetToken",
    "RegistrationVerification",
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
    "LessonFavorite",
    "LessonCommentFavorite",
    "SupportTopic",
    "SupportReply",
    "SupportTopicLike",
    "SupportTopicPin",
    "SupportTopicFavorite",
    "ChatMessage",
    "Testimonial",
    "GamificationPoint",
    "Webhook",
    "WebhookLog",
    "BackupSchedule",
    "BackupHistory",
    "ApiToken",
    "PlatformLink",
    "StudentTag",
    "StudentTagAssignment",
    "ChatBroadcastCampaign",
    "ChatBroadcastRecipient",
    "Funnel",
    "FunnelExecution",
    "Tutorial",
    "IntroductionPost",
    "IntroductionComment",
    "IntroductionLike",
    "CommunityPost",
    "CommunityPostComment",
    "CommunityPostLike",
    "CommunityPostBookmark",
    "CommunityNotification",
    "CommunityFollow",
    "CommunityStory",
    "CommunityStoryView",
    "CommunityStoryReaction",
    "CourseSalesClick",
    "CourseUpsellOffer",
    "CourseUpsellView",
    "Event",
    "EventAttendee",
    "Certificate",
    "AiTutorSetting",
    "AiTutorMessage",
    "AiKnowledgeChunk",
    "AiTutorSuggestion",
]
