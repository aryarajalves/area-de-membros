import os
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.logger import logger
from app.models.user import User
from app.models.community_feed import (
    CommunityPost,
    CommunityPostPollVote,
    CommunityPostReport,
)
from app.schemas.community_feed import (
    PollVoteIn,
    PostReportIn,
    PostReportOut,
    CommunityPostOut,
    FollowToggleOut,
    FollowUserItem,
    PostInsightsOut,
)
from app.services.gamification_service import award_points
from app.services.community_feed_service import format_post
from app.services.community_follow_service import (
    require_community_manager,
    toggle_follow_user,
    get_user_followers,
    get_user_following,
)
from app.services.community_insights_service import record_post_view, get_post_insights

router = APIRouter()

COMMUNITY_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "..",
    "uploads",
    "community"
)
os.makedirs(COMMUNITY_UPLOAD_DIR, exist_ok=True)


@router.post("/feed/{post_id}/poll/vote", response_model=CommunityPostOut, summary="Votar em Enquete", description="Registra o voto do aluno em uma opção da enquete de um post.")
@limiter.limit("30/minute")
def vote_poll(
    request: Request,
    post_id: int,
    data: PollVoteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Registra o voto do aluno em uma opção da enquete de um post.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    if not post.poll_question or not post.poll_options:
        raise HTTPException(status_code=400, detail="Esta publicação não possui uma enquete ativa.")

    # Validar se a opção existe
    valid_option_ids = []
    if isinstance(post.poll_options, list):
        for opt in post.poll_options:
            if isinstance(opt, dict) and "id" in opt:
                valid_option_ids.append(opt["id"])

    if valid_option_ids and data.option_id not in valid_option_ids:
        raise HTTPException(status_code=400, detail="Opção de enquete inválida.")

    # Verificar se já votou
    existing_vote = (
        db.query(CommunityPostPollVote)
        .filter(CommunityPostPollVote.post_id == post_id, CommunityPostPollVote.user_id == current_user.id)
        .first()
    )
    if existing_vote:
        raise HTTPException(status_code=400, detail="Você já votou nesta enquete.")

    new_vote = CommunityPostPollVote(
        post_id=post_id,
        user_id=current_user.id,
        option_id=data.option_id,
    )
    db.add(new_vote)
    db.commit()

    # Gamificação: pontua aluno por interagir na enquete (+2 XP)
    if current_user.role == "aluno":
        try:
            award_points(db, current_user, "community_poll_vote", post.id)
        except Exception as e:
            logger.warning(f"Erro ao atribuir pontos de enquete: {e}")

    # Retorna o post atualizado com novas porcentagens
    updated_post = (
        db.query(CommunityPost)
        .options(
            joinedload(CommunityPost.user),
            joinedload(CommunityPost.course),
            joinedload(CommunityPost.likes),
            joinedload(CommunityPost.bookmarks),
            joinedload(CommunityPost.poll_votes),
        )
        .filter(CommunityPost.id == post_id)
        .first()
    )
    return format_post(updated_post, current_user.id)


@router.post("/feed/{post_id}/report", response_model=PostReportOut, summary="Denunciar Publicação", description="Registra uma denúncia de postagem para moderação da equipe.")
@limiter.limit("20/minute")
def report_post(
    request: Request,
    post_id: int,
    data: PostReportIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Registra uma denúncia de postagem para moderação da equipe.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    # Verificar se já denunciou
    existing = (
        db.query(CommunityPostReport)
        .filter(CommunityPostReport.post_id == post_id, CommunityPostReport.reporter_id == current_user.id)
        .first()
    )
    if existing:
        return PostReportOut(
            id=existing.id,
            post_id=existing.post_id,
            reporter_id=existing.reporter_id,
            reporter_name=current_user.name,
            reason=existing.reason,
            description=existing.description,
            status=existing.status,
            post_content_snippet=post.content[:100] if post.content else "",
            created_at=existing.created_at,
            message="Sua denúncia já está sob análise da nossa moderação.",
        )

    report = CommunityPostReport(
        post_id=post_id,
        reporter_id=current_user.id,
        reason=data.reason,
        description=data.description,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info(f"[FEED] Denúncia registrada id={report.id} no post={post_id} por user={current_user.id} motivo={data.reason}")

    return PostReportOut(
        id=report.id,
        post_id=report.post_id,
        reporter_id=report.reporter_id,
        reporter_name=current_user.name,
        reason=report.reason,
        description=report.description,
        status=report.status,
        post_content_snippet=post.content[:100] if post.content else "",
        created_at=report.created_at,
        message="Denúncia enviada com sucesso. A moderação irá analisar o conteúdo.",
    )


@router.get("/feed/admin/reports", summary="Listar Denúncias do Feed (Admin)", description="Lista todas as publicações denunciadas para análise da equipe de moderação.")
@limiter.limit("30/minute")
def list_reports(
    request: Request,
    status_filter: Optional[str] = Query("pending", alias="status", description="'pending', 'resolved', 'dismissed', 'all'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Lista todas as publicações denunciadas para análise da equipe de moderação.
    """
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Acesso exclusivo para administradores.")

    query = (
        db.query(CommunityPostReport)
        .options(
            joinedload(CommunityPostReport.post).joinedload(CommunityPost.user),
            joinedload(CommunityPostReport.reporter),
        )
    )

    if status_filter and status_filter != "all":
        query = query.filter(CommunityPostReport.status == status_filter)

    reports = query.order_by(desc(CommunityPostReport.created_at)).all()

    items = []
    for r in reports:
        items.append({
            "id": r.id,
            "post_id": r.post_id,
            "reason": r.reason,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at,
            "reporter_name": r.reporter.name if r.reporter else "Desconhecido",
            "reporter_email": r.reporter.email if r.reporter else None,
            "post_content": r.post.content if r.post else "[Post removido]",
            "post_author_name": r.post.user.name if (r.post and r.post.user) else None,
        })

    return {"reports": items, "total": len(items)}


@router.put("/feed/admin/reports/{report_id}", summary="Moderar Denúncia (Admin)", description="Resolve, descarta ou remove uma publicação denunciada.")
@limiter.limit("30/minute")
def moderate_report(
    request: Request,
    report_id: int,
    action: str = Query(..., description="'resolve', 'dismiss', 'delete_post'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Resolve, descarta ou remove uma publicação denunciada.
    """
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Acesso exclusivo para administradores.")

    report = db.query(CommunityPostReport).filter(CommunityPostReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Denúncia não encontrada.")

    if action == "delete_post":
        post = db.query(CommunityPost).filter(CommunityPost.id == report.post_id).first()
        if post:
            db.delete(post)
        report.status = "resolved"
        msg = "Publicação removida e denúncia resolvida."
    elif action == "dismiss":
        report.status = "dismissed"
        msg = "Denúncia descartada."
    elif action == "resolve":
        report.status = "resolved"
        msg = "Denúncia marcada como resolvida."
    else:
        raise HTTPException(status_code=400, detail="Ação de moderação inválida.")

    db.commit()
    return {"message": msg, "report_id": report.id, "status": report.status}


@router.post("/feed/comments/upload-audio", summary="Upload de Áudio para Comentário", description="Faz upload de áudio gravado no microfone para incluir no comentário.")
@limiter.limit("20/minute")
async def upload_comment_audio(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_community_manager),
):
    """
    Faz upload de áudio gravado no microfone para incluir no comentário.
    """
    content_type = file.content_type or ""
    allowed_types = ["audio/webm", "audio/ogg", "audio/mp3", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "video/webm"]
    # Aceita se começar com audio/ ou estiver na lista
    if not (content_type.startswith("audio/") or content_type in allowed_types or file.filename.endswith((".webm", ".ogg", ".mp3", ".wav", ".m4a"))):
        raise HTTPException(status_code=400, detail="Formato de arquivo de áudio não suportado.")

    ext = ".webm"
    if "." in (file.filename or ""):
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()

    filename = f"audio_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(COMMUNITY_UPLOAD_DIR, filename)

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:  # 15MB
        raise HTTPException(status_code=400, detail="O áudio não pode ultrapassar 15MB.")

    with open(filepath, "wb") as f:
        f.write(content)

    return {"audio_url": f"/api/v1/feed/media/{filename}"}


@router.get("/feed/post/{post_id}", response_model=CommunityPostOut, summary="Obter Publicação por ID", description="Retorna os dados completos e atualizados de uma publicação individual.")
@limiter.limit("60/minute")
def get_post_detail(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    post = (
        db.query(CommunityPost)
        .options(
            joinedload(CommunityPost.user),
            joinedload(CommunityPost.course),
            joinedload(CommunityPost.likes),
            joinedload(CommunityPost.bookmarks),
            joinedload(CommunityPost.comments),
            joinedload(CommunityPost.poll_votes),
        )
        .filter(CommunityPost.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    return format_post(post, current_user.id)


@router.post("/feed/{post_id}/share", summary="Compartilhar Publicação", description="Registra o compartilhamento de uma publicação e incrementa o contador de shares.")
@limiter.limit("60/minute")
def share_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    post.shares_count = (post.shares_count or 0) + 1
    db.commit()
    return {"shares_count": post.shares_count}


@router.post("/feed/{post_id}/publish-now", response_model=CommunityPostOut, summary="Publicar Post Agendado Imediatamente", description="Publica imediatamente uma postagem que estava agendada.")
@limiter.limit("30/minute")
def publish_post_now(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    post = (
        db.query(CommunityPost)
        .options(
            joinedload(CommunityPost.user),
            joinedload(CommunityPost.course),
            joinedload(CommunityPost.likes),
            joinedload(CommunityPost.bookmarks),
        )
        .filter(CommunityPost.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    if post.user_id != current_user.id and current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Você não tem permissão para publicar esta postagem.")

    post.is_scheduled = False
    post.scheduled_at = None
    post.created_at = datetime.utcnow()
    db.commit()
    db.refresh(post)

    logger.info(f"[FEED] Post id={post.id} publicado imediatamente por user_id={current_user.id}")
    return format_post(post, current_user.id)


@router.post("/feed/users/{user_id}/follow", response_model=FollowToggleOut, summary="Seguir/Deixar de Seguir Membro", description="Seguir ou deixar de seguir um membro da comunidade.")
@limiter.limit("60/minute")
def toggle_follow(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Seguir ou deixar de seguir um membro da comunidade.
    """
    return toggle_follow_user(db, follower_id=current_user.id, target_user_id=user_id)


@router.get("/feed/users/{user_id}/followers", response_model=List[FollowUserItem], summary="Listar Seguidores do Membro", description="Lista os seguidores de um membro da comunidade.")
@limiter.limit("60/minute")
def list_user_followers(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Lista os seguidores de um membro da comunidade.
    """
    return get_user_followers(db, target_user_id=user_id, current_user_id=current_user.id)


@router.get("/feed/users/{user_id}/following", response_model=List[FollowUserItem], summary="Listar Quem o Membro Está Seguindo", description="Lista quem o membro da comunidade está seguindo.")
@limiter.limit("60/minute")
def list_user_following(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Lista quem o membro da comunidade está seguindo.
    """
    return get_user_following(db, target_user_id=user_id, current_user_id=current_user.id)


@router.post("/feed/{post_id}/view", summary="Registrar Visualização de Publicação", description="Registra uma visualização única do post para métricas de alcance e insights.")
@limiter.limit("120/minute")
def track_post_view(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Registra uma visualização única do post para métricas de alcance e insights.
    """
    return record_post_view(db, post_id=post_id, user_id=current_user.id)


@router.get("/feed/{post_id}/insights", response_model=PostInsightsOut, summary="Métricas e Insights da Publicação", description="Retorna métricas de alcance e engajamento da publicação (apenas autor ou admin).")
@limiter.limit("60/minute")
def get_insights(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna métricas de alcance e engajamento da publicação (apenas autor ou admin).
    """
    return get_post_insights(db, post_id=post_id, current_user=current_user)


