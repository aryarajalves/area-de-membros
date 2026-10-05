from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    cover_image_url = Column(String, nullable=True)
    bg_color = Column(String, default="#090d16", nullable=True)
    is_published = Column(Boolean, default=True)
    sales_page_url = Column(String, nullable=True)
    order_index = Column(Integer, default=0, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.order_index")


class UserCourse(Base):
    __tablename__ = "user_courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    access_duration = Column(String, default="lifetime", nullable=True)  # 'lifetime', '1_month', '3_months', '6_months', '1_year', '2_years', '3_years'
    expires_at = Column(DateTime, nullable=True)  # None = Vitalício
    created_at = Column(DateTime, default=utc_now)


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    order_index = Column(Integer, default=0, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan", order_by="Lesson.order_index")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    video_type = Column(String, default="url")  # 'url', 'upload', 'youtube', 'vimeo'
    video_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    order_index = Column(Integer, default=0, index=True)
    availability_status = Column(String, default="available", nullable=True)  # 'available', 'coming_soon'
    content_type = Column(String, default="video", nullable=True)  # 'video', 'text', 'quiz'
    text_content = Column(Text, nullable=True)
    passing_score_pct = Column(Integer, default=70, nullable=True)  # Nota mínima de aprovação no quiz (ex: 70%)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    module = relationship("Module", back_populates="lessons")
    videos = relationship("LessonVideo", back_populates="lesson", cascade="all, delete-orphan", order_by="LessonVideo.id.asc()")
    comments = relationship("LessonComment", back_populates="lesson", cascade="all, delete-orphan", order_by="LessonComment.created_at.desc()")
    attachments = relationship("LessonAttachment", back_populates="lesson", cascade="all, delete-orphan", order_by="LessonAttachment.id.asc()")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    ratings = relationship("LessonRating", back_populates="lesson", cascade="all, delete-orphan")
    reports = relationship("LessonReport", back_populates="lesson", cascade="all, delete-orphan")
    notes = relationship("LessonNote", back_populates="lesson", cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="lesson", cascade="all, delete-orphan", order_by="QuizQuestion.order_index.asc()")
    quiz_submissions = relationship("QuizSubmission", back_populates="lesson", cascade="all, delete-orphan")
    transcription = relationship("LessonTranscription", back_populates="lesson", uselist=False, cascade="all, delete-orphan")


class LessonVideo(Base):
    __tablename__ = "lesson_videos"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String, nullable=False, default="pt")
    language_label = Column(String, nullable=False, default="Português")
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    video_url = Column(String, nullable=False)
    video_type = Column(String, default="upload")
    created_at = Column(DateTime, default=utc_now)

    lesson = relationship("Lesson", back_populates="videos")


class LessonComment(Base):
    __tablename__ = "lesson_comments"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("lesson_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    lesson = relationship("Lesson", back_populates="comments")
    user = relationship("User")
    replies = relationship(
        "LessonComment",
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
        order_by="LessonComment.created_at.asc()"
    )
    likes = relationship("LessonCommentLike", back_populates="comment", cascade="all, delete-orphan")


class LessonCommentLike(Base):
    """
    Curtidas em comentários e respostas de aulas.
    Cada usuário pode curtir apenas 1 vez cada comentário.
    """
    __tablename__ = "lesson_comment_likes"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("lesson_comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", name="uq_lesson_comment_like_user"),
    )

    user = relationship("User", foreign_keys=[user_id])
    comment = relationship("LessonComment", back_populates="likes")



class LessonAttachment(Base):
    __tablename__ = "lesson_attachments"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    lesson = relationship("Lesson", back_populates="attachments")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("lesson_id", "user_id", name="uq_lesson_user_progress"),)

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    lesson = relationship("Lesson", back_populates="progress")
    user = relationship("User")


class LessonRating(Base):
    __tablename__ = "lesson_ratings"
    __table_args__ = (UniqueConstraint("lesson_id", "user_id", name="uq_lesson_user_rating"),)

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 a 5
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    lesson = relationship("Lesson", back_populates="ratings")
    user = relationship("User")


class LessonReport(Base):
    __tablename__ = "lesson_reports"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    issue_type = Column(String, nullable=False)  # 'video', 'audio', 'material', 'content', 'other'
    description = Column(Text, nullable=False)
    status = Column(String, default="open", nullable=False)  # 'open', 'resolved'
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    lesson = relationship("Lesson", back_populates="reports")
    user = relationship("User")


class LessonNote(Base):
    __tablename__ = "lesson_notes"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    lesson = relationship("Lesson", back_populates="notes")
    user = relationship("User")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    points = Column(Integer, default=1, nullable=False)  # Pontos/peso desta pergunta no quiz
    order_index = Column(Integer, default=0, index=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    lesson = relationship("Lesson", back_populates="quiz_questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan", order_by="QuizOption.order_index.asc()")


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    order_index = Column(Integer, default=0, index=True)

    question = relationship("QuizQuestion", back_populates="options")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_points = Column(Integer, default=0, nullable=True)
    earned_points = Column(Integer, default=0, nullable=True)
    passed = Column(Boolean, default=True)
    answers_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    lesson = relationship("Lesson", back_populates="quiz_submissions")
    user = relationship("User")


class LessonTranscription(Base):
    __tablename__ = "lesson_transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    full_transcript = Column(Text, nullable=True, default="")
    summary_html = Column(Text, nullable=True)
    summary_markdown = Column(Text, nullable=True)
    key_takeaways = Column(Text, nullable=True)  # JSON ou lista em texto dos principais destaques
    status = Column(String, default="ready")  # 'processing', 'ready', 'error'
    error_message = Column(Text, nullable=True)
    generated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    lesson = relationship("Lesson", back_populates="transcription")
    generated_by = relationship("User")



