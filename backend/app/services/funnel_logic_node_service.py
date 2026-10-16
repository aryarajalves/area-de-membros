import random
from datetime import datetime, timezone, timedelta, time
from typing import Tuple, Optional, Any, Dict
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.models.course import Course, UserCourse, CourseBundle
from app.models.funnel import FunnelExecution

try:
    from zoneinfo import ZoneInfo
    SAO_PAULO_TZ = ZoneInfo("America/Sao_Paulo")
except Exception:
    SAO_PAULO_TZ = timezone(timedelta(hours=-3))


def execute_ab_split_node(node_data: Dict[str, Any], current_node_id: str, funnel_id: int) -> Tuple[str, str]:
    """
    Processa a divisão de tráfego do nó Teste A/B (ab_split).
    Sorteia um número de 0 a 100 com base na porcentagem de A configurada.
    Retorna o ramo escolhido ('output_a' ou 'output_b') e o log da operação.
    """
    split_a = int(node_data.get("split_a_pct", 50))
    split_a = max(1, min(99, split_a))
    roll = random.uniform(0, 100)

    if roll < split_a:
        branch = "output_a"
        log = (
            f"Teste A/B (Nó {current_node_id}): Aluno direcionado ao Caminho A "
            f"({split_a}% configurado - Sorteio: {roll:.1f}%)"
        )
    else:
        branch = "output_b"
        log = (
            f"Teste A/B (Nó {current_node_id}): Aluno direcionado ao Caminho B "
            f"({100 - split_a}% configurado - Sorteio: {roll:.1f}%)"
        )

    logger.info(f"[FUNNEL #{funnel_id}] {log}")
    return branch, log


def execute_course_condition_node(
    db: Session,
    student_id: int,
    node_data: Dict[str, Any],
    current_node_id: str,
    funnel_id: int,
) -> Tuple[str, str]:
    """
    Avalia a condição pedagógica 'Possui Curso?' (condition_course).
    Verifica se o aluno possui matrícula ativa no curso específico ou em qualquer curso.
    Retorna a porta de saída ('output_yes' ou 'output_no') e o log detalhado.
    """
    now = datetime.now(timezone.utc)
    raw_course_id = node_data.get("course_id")
    course_title = node_data.get("course_title")

    # Caso 1: Verificar se possui qualquer curso ativo
    if raw_course_id in [None, "", "any"]:
        active_enrollment = db.query(UserCourse).filter(
            UserCourse.user_id == student_id,
            (UserCourse.expires_at == None) | (UserCourse.expires_at > now),
        ).first()
        has_access = bool(active_enrollment)
        label = "Qualquer Curso Ativo"
    else:
        try:
            target_id = int(raw_course_id)
        except (ValueError, TypeError):
            target_id = None

        if not target_id:
            has_access = False
            label = "Curso Não Informado"
        else:
            course = db.query(Course).filter(Course.id == target_id).first()
            label = course.title if course else (course_title or f"Curso #{target_id}")

            # 1. Matrícula direta
            direct = db.query(UserCourse).filter(
                UserCourse.user_id == student_id,
                UserCourse.course_id == target_id,
                (UserCourse.expires_at == None) | (UserCourse.expires_at > now),
            ).first()

            if direct:
                has_access = True
            else:
                # 2. Matrícula via Pacote/Combo de produtos (CourseBundle)
                bundle_parents = db.query(CourseBundle.parent_course_id).filter(
                    CourseBundle.bundled_course_id == target_id
                ).all()
                parent_ids = [p[0] for p in bundle_parents]

                if parent_ids:
                    bundle_direct = db.query(UserCourse).filter(
                        UserCourse.user_id == student_id,
                        UserCourse.course_id.in_(parent_ids),
                        (UserCourse.expires_at == None) | (UserCourse.expires_at > now),
                    ).first()
                    has_access = bool(bundle_direct)
                else:
                    has_access = False

    if has_access:
        branch = "output_yes"
        log = (
            f"Condicional Curso (Nó {current_node_id}): Aluno possui acesso ativo a '{label}' "
            f"-> Direcionado para Saída SIM"
        )
    else:
        branch = "output_no"
        log = (
            f"Condicional Curso (Nó {current_node_id}): Aluno NÃO possui acesso a '{label}' "
            f"-> Direcionado para Saída NÃO"
        )

    logger.info(f"[FUNNEL #{funnel_id}] {log}")
    return branch, log


def execute_stop_node(
    db: Session,
    student_id: int,
    node_data: Dict[str, Any],
    current_node_id: str,
    funnel_id: int,
    current_execution_id: Optional[int] = None,
) -> Tuple[bool, str]:
    """
    Executa o nó terminal 'Encerrar Funil' (stop).
    Finaliza imediatamente o funil ativo e, opcionalmente, cancela outras execuções ativas do aluno.
    Retorna (should_stop=True, log).
    """
    cancel_other = bool(node_data.get("cancel_other_funnels", False))
    logs = [f"Funil finalizado pelo nó Encerrar Funil (Nó {current_node_id})."]

    if cancel_other:
        query = db.query(FunnelExecution).filter(
            FunnelExecution.user_id == student_id,
            FunnelExecution.funnel_id != funnel_id,
            FunnelExecution.status.in_(["running", "delayed", "pending"]),
        )
        if current_execution_id:
            query = query.filter(FunnelExecution.id != current_execution_id)

        other_active = query.all()
        for other in other_active:
            other.status = "stopped"
            other.completed_at = datetime.now(timezone.utc)
            other.logs = (other.logs or "") + f"\nCancelado pelo nó Stop do Funil #{funnel_id}."

        if other_active:
            db.commit()
            logs.append(f"{len(other_active)} outro(s) funil(is) ativo(s) deste aluno foram cancelados.")

    log_str = " ".join(logs)
    logger.info(f"[FUNNEL #{funnel_id}] {log_str}")
    return True, log_str


def calculate_delay_with_business_hours(node_data: Dict[str, Any], current_node_id: str) -> Tuple[int, str]:
    """
    Calcula os segundos de espera do nó de Delay, ajustando para a Janela de Horário Comercial
    (Horário de Brasília) caso a opção 'business_hours_enabled' esteja ativa.
    """
    # 1. Obter valor e unidade base
    val = int(node_data.get("delay_value") or node_data.get("delay_seconds", 2))
    val = max(1, val)
    unit = str(node_data.get("delay_unit", "seconds")).lower()
    multipliers = {
        "seconds": 1,
        "second": 1,
        "segundos": 1,
        "minutes": 60,
        "minute": 60,
        "minutos": 60,
        "hours": 3600,
        "hour": 3600,
        "horas": 3600,
        "days": 86400,
        "day": 86400,
        "dias": 86400,
    }
    base_seconds = val * multipliers.get(unit, 1)

    if not node_data.get("business_hours_enabled"):
        return base_seconds, f"Aguardando delay de {base_seconds}s (Nó {current_node_id})"

    # 2. Configurações de Horário Comercial
    start_str = str(node_data.get("business_hours_start", "09:00")).strip()
    end_str = str(node_data.get("business_hours_end", "20:00")).strip()
    business_days_only = bool(node_data.get("business_days_only", False))

    try:
        sh, sm = [int(p) for p in start_str.split(":")[:2]]
        start_time = time(sh, sm)
    except Exception:
        sh, sm = 9, 0
        start_time = time(9, 0)

    try:
        eh, em = [int(p) for p in end_str.split(":")[:2]]
        end_time = time(eh, em)
    except Exception:
        eh, em = 20, 0
        end_time = time(20, 0)

    now_utc = datetime.now(timezone.utc)
    now_br = now_utc.astimezone(SAO_PAULO_TZ)
    target_dt = now_br + timedelta(seconds=base_seconds)

    # 3. Ajuste para o intervalo comercial
    # Se business_days_only e cair no fim de semana, avança até segunda
    if business_days_only:
        while target_dt.weekday() >= 5:  # 5=Sábado, 6=Domingo
            days_to_add = 7 - target_dt.weekday()
            target_dt = (target_dt + timedelta(days=days_to_add)).replace(
                hour=sh, minute=sm, second=0, microsecond=0
            )

    # Se antes do horário inicial do mesmo dia, avança para o horário inicial
    if target_dt.time() < start_time:
        target_dt = target_dt.replace(hour=sh, minute=sm, second=0, microsecond=0)
    # Se depois do horário final, avança para o horário inicial do dia seguinte
    elif target_dt.time() > end_time:
        target_dt = (target_dt + timedelta(days=1)).replace(
            hour=sh, minute=sm, second=0, microsecond=0
        )
        if business_days_only:
            while target_dt.weekday() >= 5:
                days_to_add = 7 - target_dt.weekday()
                target_dt = (target_dt + timedelta(days=days_to_add)).replace(
                    hour=sh, minute=sm, second=0, microsecond=0
                )

    adjusted_seconds = max(0, int((target_dt - now_br).total_seconds()))
    target_formatted = target_dt.strftime("%d/%m/%Y às %H:%M:%S")
    log = (
        f"Delay com Janela Comercial (Nó {current_node_id}): Base {base_seconds}s ajustado para "
        f"{adjusted_seconds}s (Envio agendado para {target_formatted} - Horário de Brasília)"
    )
    return adjusted_seconds, log
