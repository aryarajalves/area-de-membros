import json
import asyncio
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, sessionmaker

from app.core.logger import logger
from app.models.user import User
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_service import execute_funnel_flow, get_system_sender_id


def _start_funnel_execution(
    db: Session,
    funnel: Funnel,
    student_id: int,
    trigger_label: str,
    db_session_factory=None
) -> bool:
    """Função utilitária para registrar a execução e disparar a rotina do funil de forma resiliente."""
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    
    # Prevenção de execução simultânea do mesmo funil para o mesmo evento
    already_running = db.query(FunnelExecution).filter(
        FunnelExecution.funnel_id == funnel.id,
        FunnelExecution.user_id == student_id,
        FunnelExecution.status == "running",
    ).first()
    if already_running:
        return False

    execution = FunnelExecution(
        funnel_id=funnel.id,
        user_id=student_id,
        triggered_by=trigger_label,
        status="running",
        started_at=datetime.now(timezone.utc),
        logs=f"Gatilho '{trigger_label}' iniciado",
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    sender_id = get_system_sender_id(db, funnel)

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            execute_funnel_flow(
                funnel_id=funnel.id,
                student_id=student_id,
                sender_id=sender_id,
                triggered_by=trigger_label,
                execution_id=execution.id,
                db_session_factory=factory,
            )
        )
    except RuntimeError:
        try:
            asyncio.run(
                execute_funnel_flow(
                    funnel_id=funnel.id,
                    student_id=student_id,
                    sender_id=sender_id,
                    triggered_by=trigger_label,
                    execution_id=execution.id,
                    db_session_factory=factory,
                )
            )
        except Exception as run_err:
            logger.error(f"[GATILHO COMUNIDADE] Falha ao rodar fluxo síncrono para funil #{funnel.id}: {run_err}")

    logger.info(f"[GATILHO COMUNIDADE] Funil #{funnel.id} disparado com sucesso via '{trigger_label}' para o aluno #{student_id}")
    return True


def dispatch_first_testimonial_funnels(
    db: Session,
    student_id: int,
    course_id: Optional[int] = None,
    db_session_factory=None
) -> int:
    """
    Gatilho 1: Dispara funis ativos quando o aluno envia seu PRIMEIRO depoimento.
    Permite opcionalmente filtrar por curso específico ou qualquer curso.
    """
    dispatched = 0
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            matches = False
            for n in nodes:
                if n.get("type") in ("trigger", "trigger_first_testimonial"):
                    data = n.get("data", {})
                    if data.get("trigger_event") == "first_testimonial":
                        target_course = data.get("course_id")
                        if target_course and str(target_course) not in ("all", "null", ""):
                            if course_id and int(target_course) == int(course_id):
                                matches = True
                                break
                        else:
                            matches = True
                            break

            if matches:
                if _start_funnel_execution(db, f, student_id, "trigger_first_testimonial", db_session_factory):
                    dispatched += 1

    except Exception as exc:
        logger.error(f"[GATILHO DEPOIMENTO] Erro ao disparar funis de primeiro depoimento: {exc}")

    return dispatched


def dispatch_first_presentation_funnels(
    db: Session,
    student_id: int,
    db_session_factory=None
) -> int:
    """
    Gatilho 2: Dispara funis ativos quando o aluno publica sua PRIMEIRA apresentação na comunidade.
    """
    dispatched = 0
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            matches = False
            for n in nodes:
                if n.get("type") in ("trigger", "trigger_first_presentation"):
                    data = n.get("data", {})
                    if data.get("trigger_event") == "first_presentation":
                        matches = True
                        break

            if matches:
                if _start_funnel_execution(db, f, student_id, "trigger_first_presentation", db_session_factory):
                    dispatched += 1

    except Exception as exc:
        logger.error(f"[GATILHO APRESENTAÇÃO] Erro ao disparar funis de primeira apresentação: {exc}")

    return dispatched


def dispatch_level_up_funnels(
    db: Session,
    student_id: int,
    new_level: int,
    old_level: int,
    db_session_factory=None
) -> int:
    """
    Gatilho 3: Dispara funis ativos quando o aluno passa de nível (Level Up) no RPG.
    Permite acionar em qualquer nível ('any') ou em nível(is) específico(s) (ex: 5, 10).
    """
    dispatched = 0
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            matches = False
            for n in nodes:
                if n.get("type") in ("trigger", "trigger_level_up"):
                    data = n.get("data", {})
                    if data.get("trigger_event") == "level_up":
                        criterion_type = data.get("criterion_type")
                        target_levels = data.get("target_levels")
                        
                        if criterion_type == "any":
                            matches = True
                            break
                        elif target_levels and isinstance(target_levels, list) and len(target_levels) > 0:
                            try:
                                if int(new_level) in [int(lvl) for lvl in target_levels]:
                                    matches = True
                                    break
                            except (ValueError, TypeError):
                                pass
                        else:
                            target_level = data.get("target_level", "any")
                            if target_level in ("any", "all", None, ""):
                                matches = True
                                break
                            else:
                                try:
                                    if int(target_level) == int(new_level):
                                        matches = True
                                        break
                                except (ValueError, TypeError):
                                    pass

            if matches:
                trigger_label = f"trigger_level_up_lvl{new_level}"
                if _start_funnel_execution(db, f, student_id, trigger_label, db_session_factory):
                    dispatched += 1

    except Exception as exc:
        logger.error(f"[GATILHO LEVEL UP] Erro ao disparar funis de subida de nível: {exc}")

    return dispatched


def dispatch_event_attendance_funnels(
    db: Session,
    student_id: int,
    event_id: int,
    db_session_factory=None
) -> int:
    """
    Gatilho 4: Dispara funis ativos quando o aluno confirma presença / se inscreve em um evento.
    Permite filtrar por evento específico/qualquer evento OU disparar ao atingir a meta de X eventos confirmados.
    """
    dispatched = 0
    try:
        from app.models.event import EventAttendee
        total_confirmed = db.query(EventAttendee).filter(EventAttendee.user_id == student_id).count()

        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            matches = False
            matched_mode = "event"
            for n in nodes:
                if n.get("type") in ("trigger", "trigger_event_attendance"):
                    data = n.get("data", {})
                    if data.get("trigger_event") == "event_attendance":
                        attendance_mode = data.get("attendance_mode", "event")
                        if attendance_mode == "count":
                            target_count = data.get("target_count")
                            try:
                                target_count_num = int(target_count) if target_count is not None else 1
                            except (ValueError, TypeError):
                                target_count_num = 1

                            # Dispara quando o aluno atinge a meta exata de X eventos confirmados
                            if total_confirmed == target_count_num:
                                matches = True
                                matched_mode = "count"
                                break
                        else:
                            target_event = data.get("event_id")
                            if target_event and str(target_event) not in ("any", "all", "null", ""):
                                if int(target_event) == int(event_id):
                                    matches = True
                                    matched_mode = "event"
                                    break
                            else:
                                matches = True
                                matched_mode = "event"
                                break

            if matches:
                trigger_label = (
                    f"trigger_event_attendance_count{total_confirmed}"
                    if matched_mode == "count"
                    else f"trigger_event_attendance_evt{event_id}"
                )
                if _start_funnel_execution(db, f, student_id, trigger_label, db_session_factory):
                    dispatched += 1

    except Exception as exc:
        logger.error(f"[GATILHO EVENTO] Erro ao disparar funis de presença em evento: {exc}")

    return dispatched
