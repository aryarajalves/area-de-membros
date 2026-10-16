import json
import asyncio
from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import desc, func

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models.user import User
from app.models.funnel import Funnel, FunnelExecution
from app.models.course import Course, UserCourse, LessonProgress
from app.services.funnel_service import execute_funnel_flow, get_system_sender_id


def dispatch_student_created_funnels(db: Session, student_id: int, db_session_factory=None) -> int:
    """Dispara funis ativos com gatilho imediato de aluno criado (days_after=0)."""
    dispatched = 0
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            trigger_node = None
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event", "student_created") == "student_created":
                        days_after = int(data.get("days_after", 0))
                        if days_after == 0:
                            trigger_node = n
                            break

            if not trigger_node:
                continue

            already_run = db.query(FunnelExecution).filter(
                FunnelExecution.funnel_id == f.id,
                FunnelExecution.user_id == student_id,
            ).first()
            if already_run:
                continue

            execution = FunnelExecution(
                funnel_id=f.id,
                user_id=student_id,
                triggered_by="trigger_student_created",
                status="running",
                started_at=datetime.now(timezone.utc),
                logs="Gatilho de aluno criado iniciado",
            )
            db.add(execution)
            db.commit()
            db.refresh(execution)

            sender_id = get_system_sender_id(db, f)

            try:
                loop = asyncio.get_running_loop()
                loop.create_task(
                    execute_funnel_flow(
                        funnel_id=f.id,
                        student_id=student_id,
                        sender_id=sender_id,
                        triggered_by="trigger_student_created",
                        execution_id=execution.id,
                        db_session_factory=factory,
                    )
                )
            except RuntimeError:
                try:
                    asyncio.run(
                        execute_funnel_flow(
                            funnel_id=f.id,
                            student_id=student_id,
                            sender_id=sender_id,
                            triggered_by="trigger_student_created",
                            execution_id=execution.id,
                            db_session_factory=factory,
                        )
                    )
                except Exception as run_err:
                    logger.error(f"[FUNNEL GATILHO] Falha ao rodar fluxo síncrono: {run_err}")

            dispatched += 1
            logger.info(f"[FUNNEL GATILHO] Funil #{f.id} acionado imediatamente para o novo aluno #{student_id}")

    except Exception as exc:
        logger.error(f"[FUNNEL GATILHO] Erro ao disparar funis de aluno criado: {exc}")

    return dispatched


def check_and_dispatch_delayed_student_funnels(db: Session, db_session_factory=None) -> int:
    """Dispara funis com gatilho de aluno criado com atraso configurado (days_after > 0)."""
    dispatched = 0
    now = datetime.now(timezone.utc)
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            days_after = 0
            has_delayed_trigger = False
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event", "student_created") == "student_created":
                        d = int(data.get("days_after", 0))
                        if d > 0:
                            has_delayed_trigger = True
                            days_after = d
                            break

            if not has_delayed_trigger or days_after <= 0:
                continue

            target_created_threshold = now - timedelta(days=days_after)

            students = db.query(User).filter(
                User.role.in_(["aluno", "user"]),
                User.is_active == True,
                User.created_at <= target_created_threshold,
            ).all()

            for student in students:
                already_run = db.query(FunnelExecution).filter(
                    FunnelExecution.funnel_id == f.id,
                    FunnelExecution.user_id == student.id,
                ).first()
                if already_run:
                    continue

                execution = FunnelExecution(
                    funnel_id=f.id,
                    user_id=student.id,
                    triggered_by=f"trigger_student_created_{days_after}d",
                    status="running",
                    started_at=datetime.now(timezone.utc),
                    logs=f"Gatilho de {days_after} dias iniciado",
                )
                db.add(execution)
                db.commit()
                db.refresh(execution)

                sender_id = get_system_sender_id(db, f)

                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(
                        execute_funnel_flow(
                            funnel_id=f.id,
                            student_id=student.id,
                            sender_id=sender_id,
                            triggered_by=f"trigger_student_created_{days_after}d",
                            execution_id=execution.id,
                            db_session_factory=factory,
                        )
                    )
                except RuntimeError:
                    try:
                        asyncio.run(
                            execute_funnel_flow(
                                funnel_id=f.id,
                                student_id=student.id,
                                sender_id=sender_id,
                                triggered_by=f"trigger_student_created_{days_after}d",
                                execution_id=execution.id,
                                db_session_factory=factory,
                            )
                        )
                    except Exception as run_err:
                        logger.error(f"[FUNNEL GATILHO DELAY] Falha ao rodar fluxo síncrono: {run_err}")

                dispatched += 1
                logger.info(
                    f"[FUNNEL GATILHO DELAY] Funil #{f.id} acionado para o aluno #{student.id} "
                    f"({days_after} dias após cadastro)."
                )

    except Exception as exc:
        logger.error(f"[FUNNEL GATILHO DELAY] Erro na verificação periódica de gatilhos: {exc}")

    return dispatched


def dispatch_course_interest_funnels(db: Session, student_id: int, course_id: int, db_session_factory=None) -> int:
    """Dispara funis ativos quando o aluno demonstra interesse em um curso específico ou qualquer curso."""
    dispatched = 0
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            matches_trigger = False
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event") == "course_interest":
                        target_course_id = data.get("course_id")
                        if not target_course_id or target_course_id == course_id:
                            matches_trigger = True
                            break

            if not matches_trigger:
                continue

            trigger_tag = f"trigger_course_interest_{course_id}"
            already_run = db.query(FunnelExecution).filter(
                FunnelExecution.funnel_id == f.id,
                FunnelExecution.user_id == student_id,
                FunnelExecution.triggered_by == trigger_tag,
            ).first()
            if already_run:
                continue

            execution = FunnelExecution(
                funnel_id=f.id,
                user_id=student_id,
                triggered_by=trigger_tag,
                status="running",
                started_at=datetime.now(timezone.utc),
                logs=f"Gatilho de interesse no curso #{course_id} iniciado",
            )
            db.add(execution)
            db.commit()
            db.refresh(execution)

            sender_id = get_system_sender_id(db, f)

            try:
                loop = asyncio.get_running_loop()
                loop.create_task(
                    execute_funnel_flow(
                        funnel_id=f.id,
                        student_id=student_id,
                        sender_id=sender_id,
                        triggered_by=trigger_tag,
                        execution_id=execution.id,
                        db_session_factory=factory,
                    )
                )
            except RuntimeError:
                try:
                    asyncio.run(
                        execute_funnel_flow(
                            funnel_id=f.id,
                            student_id=student_id,
                            sender_id=sender_id,
                            triggered_by=trigger_tag,
                            execution_id=execution.id,
                            db_session_factory=factory,
                        )
                    )
                except Exception as run_err:
                    logger.error(f"[FUNNEL GATILHO CURSO] Falha ao rodar fluxo síncrono: {run_err}")

            dispatched += 1
            logger.info(
                f"[FUNNEL GATILHO CURSO] Funil #{f.id} disparado com sucesso para o aluno #{student_id} "
                f"(Curso #{course_id})"
            )

    except Exception as exc:
        logger.error(f"[FUNNEL GATILHO CURSO] Erro ao disparar funis de interesse em curso: {exc}")

    return dispatched


def dispatch_progress_milestone_funnels(
    db: Session,
    student_id: int,
    course_id: int,
    previous_pct: int,
    current_pct: int,
    db_session_factory=None,
) -> int:
    """
    Dispara funis com gatilho 'progress_milestone' quando o aluno cruza uma porcentagem
    configurada (25, 50, 75, 100 ou qualquer marco) em um curso específico ou qualquer curso.
    """
    dispatched = 0
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    milestones = [25, 50, 75, 100]

    # Identifica quais marcos foram cruzados nesta transição
    crossed_milestones = [m for m in milestones if previous_pct < m <= current_pct]
    if not crossed_milestones:
        return 0

    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event") == "progress_milestone":
                        target_course_id = data.get("course_id")
                        if target_course_id and int(target_course_id) != course_id:
                            continue

                        configured_milestone = data.get("milestone", "100")
                        matched_m = None

                        if configured_milestone == "all":
                            # Pega o maior marco cruzado
                            matched_m = crossed_milestones[-1]
                        else:
                            try:
                                conf_int = int(configured_milestone)
                                if conf_int in crossed_milestones:
                                    matched_m = conf_int
                            except (ValueError, TypeError):
                                pass

                        if matched_m is None:
                            continue

                        trigger_tag = f"trigger_progress_{course_id}_{matched_m}pct"
                        already_run = db.query(FunnelExecution).filter(
                            FunnelExecution.funnel_id == f.id,
                            FunnelExecution.user_id == student_id,
                            FunnelExecution.triggered_by == trigger_tag,
                        ).first()
                        if already_run:
                            continue

                        execution = FunnelExecution(
                            funnel_id=f.id,
                            user_id=student_id,
                            triggered_by=trigger_tag,
                            status="running",
                            started_at=datetime.now(timezone.utc),
                            logs=f"Gatilho de marco {matched_m}% no curso #{course_id} iniciado",
                        )
                        db.add(execution)
                        db.commit()
                        db.refresh(execution)

                        sender_id = get_system_sender_id(db, f)

                        try:
                            loop = asyncio.get_running_loop()
                            loop.create_task(
                                execute_funnel_flow(
                                    funnel_id=f.id,
                                    student_id=student_id,
                                    sender_id=sender_id,
                                    triggered_by=trigger_tag,
                                    execution_id=execution.id,
                                    db_session_factory=factory,
                                )
                            )
                        except RuntimeError:
                            try:
                                asyncio.run(
                                    execute_funnel_flow(
                                        funnel_id=f.id,
                                        student_id=student_id,
                                        sender_id=sender_id,
                                        triggered_by=trigger_tag,
                                        execution_id=execution.id,
                                        db_session_factory=factory,
                                    )
                                )
                            except Exception as run_err:
                                logger.error(f"[FUNNEL MARCO] Falha ao rodar fluxo síncrono: {run_err}")

                        dispatched += 1
                        logger.info(
                            f"[FUNNEL MARCO] Funil #{f.id} disparado para aluno #{student_id} "
                            f"(Marco {matched_m}% do Curso #{course_id})"
                        )

    except Exception as exc:
        logger.error(f"[FUNNEL MARCO] Erro ao disparar funis de marco de progresso: {exc}")

    return dispatched


def dispatch_renewal_warning_funnels(
    db: Session,
    student_id: int,
    course_id: int,
    days_before: int,
    db_session_factory=None,
) -> int:
    """
    Dispara funis com gatilho 'renewal_warning' para alunos cujos cursos
    estão a X dias de expirar (ex: 7 dias antes ou 0 dias / expirado).
    """
    dispatched = 0
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            matches_trigger = False
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event") == "renewal_warning":
                        conf_days = int(data.get("days_before", 7))
                        target_course_id = data.get("course_id")
                        if conf_days == days_before:
                            if not target_course_id or int(target_course_id) == course_id:
                                matches_trigger = True
                                break

            if not matches_trigger:
                continue

            trigger_tag = f"trigger_renewal_{course_id}_{days_before}d"
            already_run = db.query(FunnelExecution).filter(
                FunnelExecution.funnel_id == f.id,
                FunnelExecution.user_id == student_id,
                FunnelExecution.triggered_by == trigger_tag,
            ).first()
            if already_run:
                continue

            execution = FunnelExecution(
                funnel_id=f.id,
                user_id=student_id,
                triggered_by=trigger_tag,
                status="running",
                started_at=datetime.now(timezone.utc),
                logs=f"Gatilho de aviso de expiração ({days_before} dias) no curso #{course_id} iniciado",
            )
            db.add(execution)
            db.commit()
            db.refresh(execution)

            sender_id = get_system_sender_id(db, f)

            try:
                loop = asyncio.get_running_loop()
                loop.create_task(
                    execute_funnel_flow(
                        funnel_id=f.id,
                        student_id=student_id,
                        sender_id=sender_id,
                        triggered_by=trigger_tag,
                        execution_id=execution.id,
                        db_session_factory=factory,
                    )
                )
            except RuntimeError:
                try:
                    asyncio.run(
                        execute_funnel_flow(
                            funnel_id=f.id,
                            student_id=student_id,
                            sender_id=sender_id,
                            triggered_by=trigger_tag,
                            execution_id=execution.id,
                            db_session_factory=factory,
                        )
                    )
                except Exception as run_err:
                    logger.error(f"[FUNNEL RENOVACAO] Falha ao rodar fluxo síncrono: {run_err}")

            dispatched += 1
            logger.info(
                f"[FUNNEL RENOVACAO] Funil #{f.id} disparado para aluno #{student_id} "
                f"({days_before}d antes da expiração do Curso #{course_id})"
            )

    except Exception as exc:
        logger.error(f"[FUNNEL RENOVACAO] Erro ao disparar funis de renovação: {exc}")

    return dispatched


def dispatch_student_inactivity_funnels(db: Session, db_session_factory=None) -> int:
    """
    Varre alunos inativos há X dias (sem concluir aula) e dispara funis
    com gatilho 'student_inactivity'.
    """
    dispatched = 0
    now = datetime.now(timezone.utc)
    factory = db_session_factory or sessionmaker(bind=db.get_bind())
    try:
        active_funnels = db.query(Funnel).filter(Funnel.is_active == True).all()
        for f in active_funnels:
            try:
                flow = json.loads(f.flow_data or "{}")
            except Exception:
                continue

            nodes = flow.get("nodes", [])
            inactivity_trigger = None
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event") == "student_inactivity":
                        inactivity_trigger = data
                        break

            if not inactivity_trigger:
                continue

            inactive_days = int(inactivity_trigger.get("inactive_days", 7))
            target_course_id = inactivity_trigger.get("course_id")
            threshold_date = now - timedelta(days=inactive_days)

            students = db.query(User).filter(
                User.role.in_(["aluno", "user"]),
                User.is_active == True,
                User.created_at <= threshold_date,
            ).all()

            for student in students:
                # Verifica última aula concluída pelo aluno
                last_prog_query = db.query(LessonProgress).filter(
                    LessonProgress.user_id == student.id,
                    LessonProgress.is_completed == True,
                )
                if target_course_id:
                    from app.models.course import Lesson, Module
                    last_prog_query = last_prog_query.join(Lesson, LessonProgress.lesson_id == Lesson.id).join(
                        Module, Lesson.module_id == Module.id
                    ).filter(Module.course_id == int(target_course_id))

                last_progress = last_prog_query.order_by(desc(LessonProgress.completed_at)).first()
                last_activity = last_progress.completed_at if last_progress and last_progress.completed_at else student.created_at

                if last_activity and last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)

                if last_activity and last_activity > threshold_date:
                    # Aluno esteve ativo recentemente
                    continue

                trigger_tag = f"trigger_inactivity_{inactive_days}d"
                already_run = db.query(FunnelExecution).filter(
                    FunnelExecution.funnel_id == f.id,
                    FunnelExecution.user_id == student.id,
                    FunnelExecution.triggered_by == trigger_tag,
                ).first()
                if already_run:
                    continue

                execution = FunnelExecution(
                    funnel_id=f.id,
                    user_id=student.id,
                    triggered_by=trigger_tag,
                    status="running",
                    started_at=datetime.now(timezone.utc),
                    logs=f"Gatilho de inatividade de {inactive_days} dias iniciado",
                )
                db.add(execution)
                db.commit()
                db.refresh(execution)

                sender_id = get_system_sender_id(db, f)

                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(
                        execute_funnel_flow(
                            funnel_id=f.id,
                            student_id=student.id,
                            sender_id=sender_id,
                            triggered_by=trigger_tag,
                            execution_id=execution.id,
                            db_session_factory=factory,
                        )
                    )
                except RuntimeError:
                    try:
                        asyncio.run(
                            execute_funnel_flow(
                                funnel_id=f.id,
                                student_id=student.id,
                                sender_id=sender_id,
                                triggered_by=trigger_tag,
                                execution_id=execution.id,
                                db_session_factory=factory,
                            )
                        )
                    except Exception as run_err:
                        logger.error(f"[FUNNEL INATIVIDADE] Falha ao rodar fluxo síncrono: {run_err}")

                dispatched += 1
                logger.info(
                    f"[FUNNEL INATIVIDADE] Funil #{f.id} disparado para aluno inativo #{student.id} "
                    f"({inactive_days}d sem atividades)"
                )

    except Exception as exc:
        logger.error(f"[FUNNEL INATIVIDADE] Erro ao disparar funis de inatividade: {exc}")

    return dispatched
