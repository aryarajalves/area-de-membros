from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.core.logger import logger
from app.services.gamification_level_service import calculate_student_level

POINTS_MAP = {
    "course_completed": (250, "Conclusão completa do curso (100%)"),
    "module_completed": (60, "Conclusão completa de módulo do curso"),
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

    # Prevenção de duplicação para ações únicas (ex: conclusão da mesma aula, módulo, curso ou solução)
    if action in ["lesson_completed", "module_completed", "course_completed", "support_solution"] and reference_id:
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
            setattr(existing, "is_new_award", False)
            return existing

    # Cálculo do nível antes de atribuir os novos pontos
    total_before = db.query(func.coalesce(func.sum(GamificationPoint.points), 0)).filter(
        GamificationPoint.user_id == user.id
    ).scalar() or 0
    level_before = calculate_student_level(total_before)["level"]

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

        # Verifica se o aluno subiu de nível (Level Up) e dispara funis
        try:
            level_after = calculate_student_level(total_before + pts)["level"]
            if level_after > level_before:
                from app.services.funnel_community_triggers_service import dispatch_level_up_funnels
                dispatch_level_up_funnels(db, user.id, new_level=level_after, old_level=level_before)
        except Exception as lvl_err:
            logger.error(f"[Gamificação] Erro ao verificar subida de nível e disparar funis: {lvl_err}")

        setattr(point_entry, "is_new_award", True)
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
    from app.models.course import LessonProgress, Lesson, Module

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
    mod_pts, mod_desc = POINTS_MAP["module_completed"]
    course_pts, course_desc = POINTS_MAP["course_completed"]

    user_completed_map = {}
    for lp, user in completed_lessons:
        user_completed_map.setdefault(lp.user_id, set()).add(lp.lesson_id)
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

    # Sincroniza retroativamente módulos (+60 XP) e cursos (+250 XP) 100% concluídos
    if user_completed_map:
        all_modules = db.query(Module).all()
        mod_lessons = {}
        course_lessons = {}
        for m in all_modules:
            l_ids = [r[0] for r in db.query(Lesson.id).filter(Lesson.module_id == m.id).all()]
            if l_ids:
                mod_lessons[m.id] = set(l_ids)
                course_lessons.setdefault(m.course_id, set()).update(l_ids)

        for uid, done_ids in user_completed_map.items():
            for mid, req_ids in mod_lessons.items():
                if req_ids and req_ids.issubset(done_ids):
                    ex_mod = db.query(GamificationPoint).filter(
                        GamificationPoint.user_id == uid,
                        GamificationPoint.action == "module_completed",
                        GamificationPoint.reference_id == mid,
                    ).first()
                    if not ex_mod:
                        db.add(GamificationPoint(
                            user_id=uid, action="module_completed", points=mod_pts,
                            description=mod_desc, reference_id=mid, created_at=datetime.utcnow()
                        ))
                        created_count += 1

            for cid, req_c_ids in course_lessons.items():
                if req_c_ids and req_c_ids.issubset(done_ids):
                    ex_course = db.query(GamificationPoint).filter(
                        GamificationPoint.user_id == uid,
                        GamificationPoint.action == "course_completed",
                        GamificationPoint.reference_id == cid,
                    ).first()
                    if not ex_course:
                        db.add(GamificationPoint(
                            user_id=uid, action="course_completed", points=course_pts,
                            description=course_desc, reference_id=cid, created_at=datetime.utcnow()
                        ))
                        created_count += 1

    if created_count > 0:
        db.commit()
        logger.info(f"[Gamificação Sync] {created_count} pontos históricos sincronizados com sucesso.")

    return created_count

