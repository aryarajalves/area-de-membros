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


