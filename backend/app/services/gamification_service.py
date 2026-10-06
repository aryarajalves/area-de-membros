from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.core.logger import logger

POINTS_MAP = {
    "support_solution": (50, "Melhor Solução aceita no Suporte"),
    "support_reply": (10, "Resposta a dúvida de colega no Suporte"),
    "support_topic": (5, "Criação de tópico/dúvida relevante"),
    "support_like": (5, "Curtida recebida no Suporte"),
    "lesson_completed": (15, "Conclusão de aula do curso"),
    "lesson_comment": (5, "Comentário construtivo em aula"),
    "chat_message": (2, "Participação no Chat da Comunidade"),
}


def award_points(
    db: Session,
    user: User,
    action: str,
    reference_id: Optional[int] = None
) -> Optional[GamificationPoint]:
    """
    Atribui pontos de gamificação a um aluno por uma ação realizada.
    Apenas usuários com o perfil 'aluno' acumulam pontos e disputam o ranking.
    Aplica limites diários (ex: chat) e previne pontuação duplicada para eventos únicos.
    """
    if not user or user.role != "aluno":
        return None

    if action not in POINTS_MAP:
        return None

    pts, desc = POINTS_MAP[action]

    # Limite diário para mensagens no chat: máximo 10 mensagens pontuadas por dia (20 pontos/dia)
    if action == "chat_message":
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_count = (
            db.query(GamificationPoint)
            .filter(
                GamificationPoint.user_id == user.id,
                GamificationPoint.action == "chat_message",
                GamificationPoint.created_at >= today_start
            )
            .count()
        )
        if daily_count >= 10:
            return None

    # Prevenção de duplicação para ações únicas (ex: conclusão da mesma aula ou solução para o mesmo reply)
    if action in ["lesson_completed", "support_solution"] and reference_id:
        existing = (
            db.query(GamificationPoint)
            .filter(
                GamificationPoint.user_id == user.id,
                GamificationPoint.action == action,
                GamificationPoint.reference_id == reference_id
            )
            .first()
        )
        if existing:
            return existing

    try:
        point_entry = GamificationPoint(
            user_id=user.id,
            action=action,
            points=pts,
            description=desc,
            reference_id=reference_id
        )
        db.add(point_entry)
        db.commit()
        db.refresh(point_entry)
        logger.info(f"[Gamificação] +{pts} pts atribuídos ao aluno #{user.id} ({user.name}) por '{action}'.")
        return point_entry
    except Exception as exc:
        db.rollback()
        logger.error(f"[Gamificação] Erro ao atribuir pontos para o usuário #{user.id}: {exc}")
        return None


def sync_student_historical_points(db: Session, user_id: Optional[int] = None) -> int:
    """
    Sincroniza retroativamente os pontos de aulas concluídas
    para garantir a integridade da pontuação de alunos existentes.
    Retorna a quantidade de novas entradas criadas.
    """
    from app.models.course import LessonProgress

    query_lp = (
        db.query(LessonProgress, User)
        .join(User, LessonProgress.user_id == User.id)
        .filter(LessonProgress.is_completed == True, User.role == "aluno")
    )
    if user_id:
        query_lp = query_lp.filter(LessonProgress.user_id == user_id)

    completed_lessons = query_lp.all()
    created_count = 0
    pts, desc = POINTS_MAP["lesson_completed"]

    for lp, user in completed_lessons:
        existing = (
            db.query(GamificationPoint)
            .filter(
                GamificationPoint.user_id == lp.user_id,
                GamificationPoint.action == "lesson_completed",
                GamificationPoint.reference_id == lp.lesson_id,
            )
            .first()
        )
        if not existing:
            created_at = lp.completed_at or datetime.utcnow()
            point_entry = GamificationPoint(
                user_id=lp.user_id,
                action="lesson_completed",
                points=pts,
                description=desc,
                reference_id=lp.lesson_id,
                created_at=created_at,
            )
            db.add(point_entry)
            created_count += 1

    if created_count > 0:
        db.commit()
        logger.info(f"[Gamificação Sync] {created_count} pontos históricos sincronizados com sucesso.")

    return created_count

