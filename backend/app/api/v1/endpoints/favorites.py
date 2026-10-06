from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.logger import logger
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.models.course import (
    Lesson,
    Module,
    Course,
    LessonFavorite,
    LessonComment,
    LessonCommentFavorite,
)
from app.models.support import SupportTopic, SupportTopicPin, SupportTopicFavorite
from app.models.chat import ChatMessage, ChatMessageFavorite
from app.services.chat_ws_manager import chat_manager

router = APIRouter(prefix="/favorites", tags=["Favoritos"])


@router.post("/lessons/{lesson_id}/toggle", summary="Alternar favorito de uma aula")
def toggle_lesson_favorite(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Favorita ou desfavorita uma aula para o usuário logado."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    existing = db.query(LessonFavorite).filter(
        LessonFavorite.lesson_id == lesson_id,
        LessonFavorite.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id})
        logger.info(f"Aula ID {lesson_id} desfavoritada por {current_user.email}")
        return {"is_favorited": False, "lesson_id": lesson_id}
    else:
        fav = LessonFavorite(lesson_id=lesson_id, user_id=current_user.id)
        db.add(fav)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id})
        logger.info(f"Aula ID {lesson_id} favoritada por {current_user.email}")
        return {"is_favorited": True, "lesson_id": lesson_id}



@router.get("/lessons/{lesson_id}/status", summary="Verificar status de favorito da aula")
def get_lesson_favorite_status(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informa se a aula está favoritada pelo usuário logado."""
    existing = db.query(LessonFavorite).filter(
        LessonFavorite.lesson_id == lesson_id,
        LessonFavorite.user_id == current_user.id
    ).first()
    return {"is_favorited": existing is not None, "lesson_id": lesson_id}


@router.post("/comments/{comment_id}/toggle", summary="Alternar favorito de um comentário de aula")
def toggle_comment_favorite(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Favorita ou desfavorita um comentário para o usuário logado."""
    comment = db.query(LessonComment).filter(LessonComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentário não encontrado.")

    existing = db.query(LessonCommentFavorite).filter(
        LessonCommentFavorite.comment_id == comment_id,
        LessonCommentFavorite.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id})
        logger.info(f"Comentário ID {comment_id} desfavoritado por {current_user.email}")
        return {"is_favorited": False, "comment_id": comment_id}
    else:
        fav = LessonCommentFavorite(comment_id=comment_id, user_id=current_user.id)
        db.add(fav)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id})
        logger.info(f"Comentário ID {comment_id} favoritado por {current_user.email}")
        return {"is_favorited": True, "comment_id": comment_id}


@router.get("/comments/{comment_id}/status", summary="Verificar status de favorito do comentário")
def get_comment_favorite_status(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informa se o comentário está favoritado pelo usuário logado."""
    existing = db.query(LessonCommentFavorite).filter(
        LessonCommentFavorite.comment_id == comment_id,
        LessonCommentFavorite.user_id == current_user.id
    ).first()
    return {"is_favorited": existing is not None, "comment_id": comment_id}


@router.post("/topics/{topic_id}/toggle", summary="Alternar favorito de uma dúvida de suporte")
def toggle_topic_favorite(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Favorita ou desfavorita uma dúvida de suporte para o usuário logado."""
    topic = db.query(SupportTopic).filter(SupportTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Dúvida de suporte não encontrada.")

    existing = db.query(SupportTopicFavorite).filter(
        SupportTopicFavorite.topic_id == topic_id,
        SupportTopicFavorite.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id})
        logger.info(f"Dúvida ID {topic_id} desfavoritada por {current_user.email}")
        return {"is_favorited": False, "topic_id": topic_id}
    else:
        fav = SupportTopicFavorite(topic_id=topic_id, user_id=current_user.id)
        db.add(fav)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id})
        logger.info(f"Dúvida ID {topic_id} favoritada por {current_user.email}")
        return {"is_favorited": True, "topic_id": topic_id}



@router.get("/topics/{topic_id}/status", summary="Verificar status de favorito da dúvida de suporte")
def get_topic_favorite_status(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informa se a dúvida de suporte está favoritada pelo usuário logado."""
    existing = db.query(SupportTopicFavorite).filter(
        SupportTopicFavorite.topic_id == topic_id,
        SupportTopicFavorite.user_id == current_user.id
    ).first()
    return {"is_favorited": existing is not None, "topic_id": topic_id}


@router.get("", summary="Listar todos os itens favoritados pelo usuário")
def list_user_favorites(
    category: Optional[str] = Query(None, description="Filtro opcional: all, topics, lessons, comments, messages"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os favoritos do usuário divididos nas abas:
    - topics: Dúvidas / chamados de suporte favoritados
    - lessons: Aulas favoritas
    - comments: Comentários de aulas favoritados
    - messages: Mensagens do chat favoritas
    """
    user_id = current_user.id

    # 1. Dúvidas / Tópicos de Suporte (SupportTopicFavorite + SupportTopicPin)
    topics_list = []
    if not category or category in ("all", "topics", "duvidas"):
        fav_topics = (
            db.query(SupportTopicFavorite)
            .filter(SupportTopicFavorite.user_id == user_id)
            .order_by(desc(SupportTopicFavorite.created_at))
            .limit(limit)
            .all()
        )
        seen_topic_ids = set()
        for ft in fav_topics:
            t = ft.topic
            if t and t.id not in seen_topic_ids:
                seen_topic_ids.add(t.id)
                topics_list.append({
                    "id": t.id,
                    "title": t.title,
                    "content": t.content[:140] + ("..." if len(t.content) > 140 else ""),
                    "status": t.status,
                    "created_at": ft.created_at.isoformat() if ft.created_at else None,
                    "course_id": t.course_id,
                    "course_title": t.course.title if t.course else None,
                    "author": {
                        "id": t.user.id if t.user else 0,
                        "name": t.user.name if t.user else "Usuário",
                        "avatar_url": t.user.avatar_url if t.user else None,
                    },
                })
        # Inclui também pins se houver e não estiver na lista
        pins = (
            db.query(SupportTopicPin)
            .filter(SupportTopicPin.user_id == user_id)
            .order_by(desc(SupportTopicPin.created_at))
            .limit(limit)
            .all()
        )
        for pin in pins:
            t = pin.topic
            if t and t.id not in seen_topic_ids:
                seen_topic_ids.add(t.id)
                topics_list.append({
                    "id": t.id,
                    "title": t.title,
                    "content": t.content[:140] + ("..." if len(t.content) > 140 else ""),
                    "status": t.status,
                    "created_at": pin.created_at.isoformat() if pin.created_at else None,
                    "course_id": t.course_id,
                    "course_title": t.course.title if t.course else None,
                    "author": {
                        "id": t.user.id if t.user else 0,
                        "name": t.user.name if t.user else "Usuário",
                        "avatar_url": t.user.avatar_url if t.user else None,
                    },
                })

    # 2. Aulas Favoritas (LessonFavorite)
    lessons_list = []
    if not category or category in ("all", "lessons", "aulas"):
        fav_lessons = (
            db.query(LessonFavorite)
            .filter(LessonFavorite.user_id == user_id)
            .order_by(desc(LessonFavorite.created_at))
            .limit(limit)
            .all()
        )
        for fl in fav_lessons:
            l = fl.lesson
            if l:
                mod = l.module
                crs = mod.course if mod else None
                lessons_list.append({
                    "id": l.id,
                    "title": l.title,
                    "description": (l.description or "")[:120],
                    "duration": l.duration,
                    "thumbnail_url": l.thumbnail_url or (crs.thumbnail_url if crs else None),
                    "created_at": fl.created_at.isoformat() if fl.created_at else None,
                    "module_id": mod.id if mod else None,
                    "module_title": mod.title if mod else None,
                    "course_id": crs.id if crs else None,
                    "course_title": crs.title if crs else None,
                })

    # 3. Comentários de Aula Favoritos (LessonCommentFavorite)
    comments_list = []
    if not category or category in ("all", "comments", "comentarios"):
        fav_comments = (
            db.query(LessonCommentFavorite)
            .filter(LessonCommentFavorite.user_id == user_id)
            .order_by(desc(LessonCommentFavorite.created_at))
            .limit(limit)
            .all()
        )
        for fc in fav_comments:
            c = fc.comment
            if c:
                l = c.lesson
                mod = l.module if l else None
                crs = mod.course if mod else None
                comments_list.append({
                    "id": c.id,
                    "content": c.content,
                    "created_at": fc.created_at.isoformat() if fc.created_at else None,
                    "lesson_id": l.id if l else None,
                    "lesson_title": l.title if l else None,
                    "course_id": crs.id if crs else None,
                    "course_title": crs.title if crs else None,
                    "author": {
                        "id": c.user.id if c.user else 0,
                        "name": c.user.name if c.user else "Usuário",
                        "avatar_url": c.user.avatar_url if c.user else None,
                        "role": c.user.role if c.user else "aluno",
                    },
                })

    # 4. Mensagens do Chat Favoritas (ChatMessageFavorite)
    messages_list = []
    if not category or category in ("all", "messages", "mensagens"):
        fav_msgs = (
            db.query(ChatMessageFavorite)
            .filter(ChatMessageFavorite.user_id == user_id)
            .order_by(desc(ChatMessageFavorite.created_at))
            .limit(limit)
            .all()
        )
        for fm in fav_msgs:
            m = fm.message
            if m:
                messages_list.append({
                    "id": m.id,
                    "message": m.message or "",
                    "media_url": m.media_url,
                    "media_type": m.media_type,
                    "channel_type": m.channel_type,
                    "course_id": m.course_id,
                    "created_at": fm.created_at.isoformat() if fm.created_at else None,
                    "author": {
                        "id": m.user.id if m.user else 0,
                        "name": m.user.name if m.user else "Usuário",
                        "avatar_url": m.user.avatar_url if m.user else None,
                        "role": m.user.role if m.user else "aluno",
                    },
                })

    counts = {
        "topics": db.query(SupportTopicPin).filter(SupportTopicPin.user_id == user_id).count(),
        "lessons": db.query(LessonFavorite).filter(LessonFavorite.user_id == user_id).count(),
        "comments": db.query(LessonCommentFavorite).filter(LessonCommentFavorite.user_id == user_id).count(),
        "messages": db.query(ChatMessageFavorite).filter(ChatMessageFavorite.user_id == user_id).count(),
    }
    counts["total"] = counts["topics"] + counts["lessons"] + counts["comments"] + counts["messages"]

    return {
        "topics": topics_list,
        "lessons": lessons_list,
        "comments": comments_list,
        "messages": messages_list,
        "counts": counts,
    }
