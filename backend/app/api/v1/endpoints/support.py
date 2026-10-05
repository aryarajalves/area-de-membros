import os
import uuid
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.logger import logger
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.support import SupportTopic, SupportReply, SupportTopicLike
from app.schemas.support import (
    SupportCourseItem,
    SupportTopicCreate,
    SupportReplyCreate,
    SupportTopicListResponse,
    SupportTopicListItem,
    SupportTopicDetail,
    SupportReplyResponse,
    SupportAuthor,
    LastReplyInfo,
    SupportStatusUpdate,
    SupportStatsResponse,
)
from fastapi.responses import FileResponse
from app.services.storage import upload_media_file

router = APIRouter(tags=["Suporte e Dúvidas"])


def check_student_course_access(user: User, course_id: int, db: Session) -> bool:
    """Verifica se o aluno possui acesso ativo ao curso."""
    if user.role in ("superadmin", "admin"):
        return True
    now = datetime.now(timezone.utc)
    user_course = db.query(UserCourse).filter(
        UserCourse.user_id == user.id,
        UserCourse.course_id == course_id,
        or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
    ).first()
    return user_course is not None


@router.get(
    "/my-courses",
    response_model=List[SupportCourseItem],
    summary="Listar Cursos Permitidos para Dúvidas",
    description="Retorna a lista de cursos aos quais o usuário logado tem acesso ativo para seleção ao criar dúvidas."
)
def get_my_courses_for_support(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os cursos aos quais o usuário logado tem acesso.
    Usado no dropdown de criação de novas dúvidas no suporte.
    """
    if current_user.role in ("superadmin", "admin"):
        courses = db.query(Course).order_by(Course.title.asc()).all()
    else:
        now = datetime.now(timezone.utc)
        courses = (
            db.query(Course)
            .join(UserCourse, UserCourse.course_id == Course.id)
            .filter(
                UserCourse.user_id == current_user.id,
                or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
            )
            .order_by(Course.title.asc())
            .all()
        )
    return courses


@router.get(
    "/stats",
    response_model=SupportStatsResponse,
    summary="Estatísticas da Comunidade e Suporte",
    description="Retorna métricas consolidadas: total de tópicos, sem respostas, resolvidas, taxa de resolução e membros ativos."
)
def get_support_community_stats(
    course_id: Optional[int] = Query(None, description="Filtrar métricas por curso específico"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna métricas consolidadas do suporte e comunidade de alunos."""
    query = db.query(SupportTopic)
    if course_id:
        query = query.filter(SupportTopic.course_id == course_id)

    total_topics = query.count()
    has_replies_sub = db.query(SupportReply.topic_id).subquery()
    unanswered_count = query.filter(~SupportTopic.id.in_(has_replies_sub.select())).count()
    resolved_count = query.filter(SupportTopic.status == "resolved").count()
    resolution_rate_pct = int(round((resolved_count / total_topics) * 100)) if total_topics > 0 else 100

    # Membros únicos envolvidos
    authors_count = db.query(SupportTopic.user_id).distinct().count()
    reply_users_count = db.query(SupportReply.user_id).distinct().count()
    active_members_count = max(authors_count, reply_users_count, 1)

    return SupportStatsResponse(
        total_topics=total_topics,
        unanswered_count=unanswered_count,
        resolved_count=resolved_count,
        resolution_rate_pct=resolution_rate_pct,
        active_members_count=active_members_count,
    )


@router.get(
    "/topics",
    response_model=SupportTopicListResponse,
    summary="Listar Dúvidas da Comunidade",
    description="Retorna dúvidas da comunidade com suporte a busca textual, filtro por curso e ordenação (recentes, populares, sem resposta)."
)
def list_support_topics(
    course_id: Optional[int] = Query(None, description="Filtrar por curso específico"),
    search: Optional[str] = Query(None, description="Busca textual no título ou conteúdo"),
    status: Optional[str] = Query(None, description="Filtrar por status: open | resolved"),
    sort: str = Query("recent", description="recent | popular | unanswered | my_topics | resolved"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista dúvidas da comunidade com filtros por curso, busca textual e ordenação.
    """
    query = db.query(SupportTopic)

    if course_id:
        query = query.filter(SupportTopic.course_id == course_id)

    if status:
        query = query.filter(SupportTopic.status == status)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SupportTopic.title.ilike(search_filter),
                SupportTopic.content.ilike(search_filter),
            )
        )

    # Ordenação e filtros por tipo
    if sort == "popular":
        query = query.order_by(SupportTopic.likes_count.desc(), SupportTopic.created_at.desc())
    elif sort == "unanswered":
        # Subquery para tópicos sem respostas
        has_replies = db.query(SupportReply.topic_id).subquery()
        query = query.filter(~SupportTopic.id.in_(has_replies.select())).order_by(SupportTopic.created_at.desc())
    elif sort == "my_topics":
        query = query.filter(SupportTopic.user_id == current_user.id).order_by(SupportTopic.created_at.desc())
    elif sort == "resolved":
        query = query.filter(SupportTopic.status == "resolved").order_by(SupportTopic.created_at.desc())
    else:
        query = query.order_by(SupportTopic.created_at.desc())

    total = query.count()
    topics = query.offset((page - 1) * limit).limit(limit).all()

    # IDs dos tópicos que o usuário curtiu
    topic_ids = [t.id for t in topics]
    liked_ids = set()
    if topic_ids:
        likes = (
            db.query(SupportTopicLike.topic_id)
            .filter(
                SupportTopicLike.user_id == current_user.id,
                SupportTopicLike.topic_id.in_(topic_ids),
            )
            .all()
        )
        liked_ids = {l[0] for l in likes}

    topic_items = []
    for t in topics:
        replies_count = len(t.replies)
        last_reply = None
        has_solution = any(bool(getattr(r, "is_solution", False)) for r in t.replies)

        if replies_count > 0:
            latest = t.replies[-1]
            if latest.user:
                last_reply = LastReplyInfo(
                    author_name=latest.user.name,
                    role=latest.user.role,
                    created_at=latest.created_at,
                )

        topic_items.append(
            SupportTopicListItem(
                id=t.id,
                title=t.title,
                content=t.content,
                image_url=t.image_url,
                status=t.status or "open",
                likes_count=t.likes_count or 0,
                replies_count=replies_count,
                liked_by_me=(t.id in liked_ids),
                has_solution=has_solution,
                course=SupportCourseItem(
                    id=t.course.id,
                    title=t.course.title,
                    thumbnail_url=t.course.thumbnail_url,
                ),
                author=SupportAuthor(
                    id=t.user.id,
                    name=t.user.name,
                    email=t.user.email,
                    role=t.user.role,
                ),
                last_reply=last_reply,
                created_at=t.created_at,
            )
        )

    return SupportTopicListResponse(
        items=topic_items,
        total=total,
        page=page,
        page_size=limit,
    )


@router.post(
    "/topics",
    response_model=SupportTopicListItem,
    status_code=201,
    summary="Publicar Nova Dúvida",
    description="Cria uma nova dúvida associada a um curso com título, conteúdo detalhado e print/imagem opcional."
)
def create_support_topic(
    payload: SupportTopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Publica uma nova dúvida na comunidade de suporte vinculada ao curso.
    Verifica se o aluno possui acesso ao curso selecionado.
    """
    # Valida se o curso existe
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    # Valida permissão de acesso ao curso
    if not check_student_course_access(current_user, payload.course_id, db):
        raise HTTPException(
            status_code=403,
            detail="Você não possui acesso liberado a este curso para abrir dúvidas.",
        )

    topic = SupportTopic(
        user_id=current_user.id,
        course_id=payload.course_id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        image_url=payload.image_url,
        status="open",
        likes_count=0,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)

    logger.info(f"Nova dúvida criada por {current_user.email} no curso '{course.title}': {topic.title}")

    return SupportTopicListItem(
        id=topic.id,
        title=topic.title,
        content=topic.content,
        image_url=topic.image_url,
        status=topic.status,
        likes_count=0,
        replies_count=0,
        liked_by_me=False,
        course=SupportCourseItem(
            id=course.id,
            title=course.title,
            thumbnail_url=course.thumbnail_url,
        ),
        author=SupportAuthor(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            role=current_user.role,
        ),
        last_reply=None,
        created_at=topic.created_at,
    )


@router.get(
    "/topics/{topic_id}",
    response_model=SupportTopicDetail,
    summary="Obter Detalhes da Dúvida",
    description="Retorna a dúvida completa com autor, data, curtidas e a lista cronológica de respostas de instrutores e alunos."
)
def get_support_topic_detail(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os detalhes da dúvida e a lista completa de respostas.
    """
    topic = db.query(SupportTopic).filter(SupportTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada.")

    # Verifica like do usuário logado
    user_like = (
        db.query(SupportTopicLike)
        .filter(
            SupportTopicLike.topic_id == topic.id,
            SupportTopicLike.user_id == current_user.id,
        )
        .first()
    )

    replies = []
    for r in topic.replies:
        replies.append(
            SupportReplyResponse(
                id=r.id,
                topic_id=r.topic_id,
                content=r.content,
                image_url=r.image_url,
                is_instructor_reply=r.is_instructor_reply,
                is_solution=bool(getattr(r, "is_solution", False)),
                created_at=r.created_at,
                author=SupportAuthor(
                    id=r.user.id,
                    name=r.user.name,
                    email=r.user.email,
                    role=r.user.role,
                ),
            )
        )

    last_reply_user_name = replies[-1].author.name if replies else None
    last_reply_at = replies[-1].created_at if replies else None
    has_solution = any(r.is_solution for r in replies)

    return SupportTopicDetail(
        id=topic.id,
        title=topic.title,
        content=topic.content,
        image_url=topic.image_url,
        status=topic.status or "open",
        likes_count=topic.likes_count or 0,
        liked_by_me=user_like is not None,
        has_solution=has_solution,
        created_at=topic.created_at,
        course=SupportCourseItem(
            id=topic.course.id,
            title=topic.course.title,
            thumbnail_url=topic.course.thumbnail_url,
        ),
        author=SupportAuthor(
            id=topic.user.id,
            name=topic.user.name,
            email=topic.user.email,
            role=topic.user.role,
        ),
        last_reply_user_name=last_reply_user_name,
        last_reply_at=last_reply_at,
        replies=replies,
    )


@router.patch(
    "/topics/{topic_id}/status",
    summary="Alterar Status da Dúvida (Resolvida / Em Aberto)",
    description="Permite que o autor ou instrutor/admin alterne o status da dúvida entre 'open' e 'resolved'."
)
def update_support_topic_status(
    topic_id: int,
    data: SupportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualiza o status de uma dúvida (open / resolved / closed)."""
    topic = db.query(SupportTopic).filter(SupportTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada.")

    is_author = (topic.user_id == current_user.id)
    is_manager = current_user.role in ("superadmin", "admin")
    if not (is_author or is_manager):
        raise HTTPException(status_code=403, detail="Você não tem permissão para alterar o status desta dúvida.")

    topic.status = data.status
    db.commit()
    db.refresh(topic)
    return {"id": topic.id, "status": topic.status}


@router.patch(
    "/replies/{reply_id}/solution",
    summary="Marcar Resposta como Solução Oficial",
    description="Permite que o autor do tópico ou instrutor/admin marque ou desmarque uma resposta como a Solução Oficial."
)
def toggle_reply_solution(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca ou desmarca uma resposta como Solução Oficial."""
    reply = db.query(SupportReply).filter(SupportReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Resposta não encontrada.")

    topic = reply.topic
    is_author = (topic.user_id == current_user.id)
    is_manager = current_user.role in ("superadmin", "admin")
    if not (is_author or is_manager):
        raise HTTPException(status_code=403, detail="Apenas o autor ou o instrutor podem definir a solução oficial.")

    # Se já é solução, desmarca
    if getattr(reply, "is_solution", False):
        reply.is_solution = False
    else:
        # Desmarca outras soluções deste tópico
        db.query(SupportReply).filter(
            SupportReply.topic_id == topic.id,
            SupportReply.is_solution == True
        ).update({"is_solution": False})
        reply.is_solution = True
        topic.status = "resolved"

        # Gamificação: +50 pontos para o autor da Melhor Solução
        try:
            from app.services.gamification_service import award_points
            if reply.user:
                award_points(db, reply.user, "support_solution", reference_id=reply.id)
        except Exception as g_exc:
            logger.error(f"Erro ao atribuir pontos por melhor solução: {g_exc}")

    db.commit()
    return {
        "reply_id": reply.id,
        "is_solution": bool(reply.is_solution),
        "topic_id": topic.id,
        "topic_status": topic.status
    }


@router.post(
    "/topics/{topic_id}/replies",
    response_model=SupportReplyResponse,
    status_code=201,
    summary="Responder a uma Dúvida",
    description="Envia uma resposta para a dúvida. Identifica automaticamente respostas de instrutores/superadministradores."
)
def add_support_reply(
    topic_id: int,
    payload: SupportReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Adiciona uma resposta a uma dúvida existente.
    """
    topic = db.query(SupportTopic).filter(SupportTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada.")

    is_instructor = current_user.role in ("superadmin", "admin")

    reply = SupportReply(
        topic_id=topic.id,
        user_id=current_user.id,
        content=payload.content.strip(),
        image_url=payload.image_url,
        is_instructor_reply=is_instructor,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    # Gamificação: +10 pontos para o aluno que respondeu à dúvida
    try:
        from app.services.gamification_service import award_points
        award_points(db, current_user, "support_reply", reference_id=reply.id)
    except Exception as g_exc:
        logger.error(f"Erro ao atribuir pontos por resposta no suporte: {g_exc}")

    logger.info(f"Resposta adicionada por {current_user.email} no tópico ID {topic.id} (Instrutor: {is_instructor})")

    return SupportReplyResponse(
        id=reply.id,
        topic_id=reply.topic_id,
        content=reply.content,
        image_url=reply.image_url,
        is_instructor_reply=reply.is_instructor_reply,
        created_at=reply.created_at,
        author=SupportAuthor(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            role=current_user.role,
        ),
    )


@router.post(
    "/topics/{topic_id}/like",
    summary="Curtir/Descurtir Dúvida",
    description="Alterna a curtida do usuário autenticado no tópico de suporte selecionado."
)
def toggle_support_topic_like(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alterna a curtida do usuário na dúvida (like / unlike).
    """
    topic = db.query(SupportTopic).filter(SupportTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada.")

    existing_like = (
        db.query(SupportTopicLike)
        .filter(
            SupportTopicLike.topic_id == topic.id,
            SupportTopicLike.user_id == current_user.id,
        )
        .first()
    )

    if existing_like:
        db.delete(existing_like)
        topic.likes_count = max(0, (topic.likes_count or 1) - 1)
        liked = False
    else:
        new_like = SupportTopicLike(topic_id=topic.id, user_id=current_user.id)
        db.add(new_like)
        topic.likes_count = (topic.likes_count or 0) + 1
        liked = True

        # Gamificação: +5 pontos para o autor do tópico curtido (se não for auto-curtida)
        if topic.user_id != current_user.id and topic.user:
            try:
                from app.services.gamification_service import award_points
                award_points(db, topic.user, "support_like", reference_id=topic.id)
            except Exception as g_exc:
                logger.error(f"Erro ao atribuir pontos por curtida recebida no suporte: {g_exc}")

    db.commit()
    return {"liked": liked, "likes_count": topic.likes_count}


@router.delete(
    "/topics/{topic_id}",
    summary="Excluir Dúvida",
    description="Exclui o tópico de dúvida e todas as suas respostas (Apenas o autor ou SuperAdmin)."
)
def delete_support_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui um tópico de dúvida (apenas o autor ou admin/superadmin).
    """
    topic = db.query(SupportTopic).filter(SupportTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Dúvida não encontrada.")

    if current_user.role not in ("superadmin", "admin") and topic.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta publicação.")

    db.delete(topic)
    db.commit()
    logger.info(f"Tópico ID {topic_id} excluído por {current_user.email}")
    return {"detail": "Dúvida excluída com sucesso."}


@router.delete(
    "/topics/{topic_id}/replies/{reply_id}",
    summary="Excluir Resposta de Dúvida",
    description="Exclui uma resposta de suporte (Apenas o autor da resposta ou SuperAdmin)."
)
def delete_support_reply(
    topic_id: int,
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui uma resposta (apenas o autor da resposta ou admin/superadmin).
    """
    reply = (
        db.query(SupportReply)
        .filter(SupportReply.id == reply_id, SupportReply.topic_id == topic_id)
        .first()
    )
    if not reply:
        raise HTTPException(status_code=404, detail="Resposta não encontrada.")

    if current_user.role not in ("superadmin", "admin") and reply.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta resposta.")

    db.delete(reply)
    db.commit()
    logger.info(f"Resposta ID {reply_id} excluída por {current_user.email}")
    return {"detail": "Resposta excluída com sucesso."}


@router.post(
    "/upload-image",
    summary="Upload de Imagem para Suporte",
    description="Recebe arquivos de imagem (PNG, JPG, WEBP até 10 MB) para anexar em dúvidas ou respostas."
)
async def upload_support_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Faz upload de imagem para ser anexada a uma dúvida ou resposta.
    Aceita PNG, JPG, JPEG, WEBP, GIF de até 10 MB.
    """
    allowed_exts = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido. Use PNG, JPG, JPEG ou WEBP.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="A imagem não pode ultrapassar 10 MB.")

    filename = f"support_{uuid.uuid4().hex[:12]}{ext}"

    # Tenta upload para o Backblaze B2 / S3
    uploaded_url = upload_media_file(
        contents,
        filename,
        file.content_type or "image/jpeg",
        folder="AreaDeMembros/support/",
    )

    if not uploaded_url:
        # Fallback local
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        upload_dir = os.path.join(base_dir, "uploads", "support")
        os.makedirs(upload_dir, exist_ok=True)
        local_path = os.path.join(upload_dir, filename)
        with open(local_path, "wb") as f:
            f.write(contents)
        uploaded_url = f"/api/v1/support/files/{filename}"

    return {"image_url": uploaded_url}


@router.get("/files/{filename}", include_in_schema=False)
def get_support_file(filename: str):
    """Serve imagens anexadas localmente quando S3/B2 estiver indisponível."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    file_path = os.path.join(base_dir, "uploads", "support", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return FileResponse(file_path)
