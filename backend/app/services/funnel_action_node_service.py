import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import httpx

from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.gamification import GamificationPoint
from app.models.chat import ChatMessage
from app.services.chat_encryption_service import encrypt_dm_message
from app.services.chat_ws_manager import chat_manager


async def execute_action_node(
    db: Session,
    student: User,
    node_type: str,
    node_data: Dict[str, Any],
    node_id: str,
    funnel_id: int,
) -> str:
    """
    Roteia a execução dos nós de Ação do Funil (Webhook, Matrícula, XP e Notificação Interna).
    Retorna a string de log que será gravada no histórico de execução.
    """
    if node_type == "action_webhook":
        return await execute_webhook_node(student, node_data, node_id, funnel_id)
    elif node_type == "action_enrollment":
        return execute_enrollment_node(db, student, node_data, node_id, funnel_id)
    elif node_type == "action_gamification_xp":
        return execute_gamification_xp_node(db, student, node_data, node_id, funnel_id)
    elif node_type == "action_internal_notify":
        return await execute_internal_notify_node(db, student, node_data, node_id, funnel_id)
    return f"Ação desconhecida '{node_type}' (Nó {node_id})"


def interpolate_webhook_text(template: str, student: User, funnel_id: int, node_id: str) -> str:
    """
    Substitui variáveis dinâmicas (estilo ManyChat) no texto ou JSON do webhook.
    Ex: {{nome}}, {{email}}, {{telefone}}, {{id}}, {{funnel_id}}.
    """
    if not template:
        return ""
    replacements = {
        "{{nome}}": student.name or "",
        "{{aluno.nome}}": student.name or "",
        "{{name}}": student.name or "",
        "{{email}}": student.email or "",
        "{{aluno.email}}": student.email or "",
        "{{telefone}}": getattr(student, "phone", "") or "",
        "{{aluno.telefone}}": getattr(student, "phone", "") or "",
        "{{phone}}": getattr(student, "phone", "") or "",
        "{{id}}": str(student.id),
        "{{aluno.id}}": str(student.id),
        "{{funnel_id}}": str(funnel_id),
        "{{funil.id}}": str(funnel_id),
        "{{node_id}}": str(node_id),
        "{{timestamp}}": datetime.now(timezone.utc).isoformat(),
    }
    result = template
    for key, val in replacements.items():
        result = result.replace(key, str(val))
    return result


async def execute_webhook_node(
    student: User,
    node_data: Dict[str, Any],
    node_id: str,
    funnel_id: int,
) -> str:
    """Dispara uma requisição HTTP externa (POST ou GET) para a URL configurada, com suporte a JSON customizado (ManyChat style)."""
    url = (node_data.get("url") or "").strip()
    if not url:
        return f"[WEBHOOK] Ignorado: URL não informada no Nó {node_id}"

    method = (node_data.get("method") or "POST").upper()
    payload_type = node_data.get("payload_type", "default")
    custom_json_raw = node_data.get("custom_json")

    # Monta headers padrão e customizados
    headers = {"Content-Type": "application/json"}
    custom_headers = node_data.get("custom_headers")
    if isinstance(custom_headers, dict):
        for k, v in custom_headers.items():
            headers[k] = interpolate_webhook_text(str(v), student, funnel_id, node_id)
    elif isinstance(custom_headers, str) and custom_headers.strip():
        for line in custom_headers.strip().split("\n"):
            if ":" in line:
                hk, hv = line.split(":", 1)
                headers[hk.strip()] = interpolate_webhook_text(hv.strip(), student, funnel_id, node_id)

    # Determina o payload (Padrão ou Customizado ManyChat)
    post_json = None
    post_content = None

    if payload_type == "custom" and custom_json_raw and custom_json_raw.strip():
        interpolated = interpolate_webhook_text(custom_json_raw.strip(), student, funnel_id, node_id)
        try:
            post_json = json.loads(interpolated)
        except Exception:
            post_content = interpolated
    else:
        post_json = {
            "event": "funnel_webhook",
            "funnel_id": funnel_id,
            "node_id": node_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "student": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "phone": getattr(student, "phone", None),
                "role": student.role,
            },
        }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            if method == "GET":
                params = {
                    "student_id": str(student.id),
                    "email": student.email or "",
                    "funnel_id": str(funnel_id),
                }
                res = await client.get(url, params=params, headers=headers)
            else:
                if post_json is not None:
                    res = await client.post(url, json=post_json, headers=headers)
                else:
                    res = await client.post(url, content=post_content, headers=headers)

        status_code = res.status_code
        logger.info(f"[FUNNEL #{funnel_id}] Webhook Nó {node_id} ({payload_type}) disparado para {url} -> Status {status_code}")
        return f"[WEBHOOK] Disparado ({method} {url}) - HTTP {status_code} (Nó {node_id})"
    except Exception as exc:
        logger.warning(f"[FUNNEL #{funnel_id}] Falha na chamada webhook do Nó {node_id} ({url}): {exc}")
        return f"[WEBHOOK FALHOU] Erro ao chamar {url}: {str(exc)} (Nó {node_id})"


def execute_enrollment_node(
    db: Session,
    student: User,
    node_data: Dict[str, Any],
    node_id: str,
    funnel_id: int,
) -> str:
    """Concede matrícula automática / acesso a um curso bônus ou ferramenta ao aluno."""
    course_id_raw = node_data.get("course_id")
    if not course_id_raw:
        return f"[MATRÍCULA] Ignorado: Curso não selecionado no Nó {node_id}"

    try:
        course_id = int(course_id_raw)
    except (ValueError, TypeError):
        return f"[MATRÍCULA] Erro: ID de curso inválido ({course_id_raw}) no Nó {node_id}"

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return f"[MATRÍCULA] Erro: Curso #{course_id} não encontrado no Nó {node_id}"

    duration = node_data.get("access_duration", "lifetime")
    now = datetime.now(timezone.utc)
    expires_at = None

    duration_days = {
        "1_month": 30,
        "3_months": 90,
        "6_months": 180,
        "1_year": 365,
        "2_years": 730,
        "3_years": 1095,
    }
    if duration in duration_days:
        expires_at = now + timedelta(days=duration_days[duration])

    user_course = db.query(UserCourse).filter(
        UserCourse.user_id == student.id,
        UserCourse.course_id == course_id,
    ).first()

    if user_course:
        user_course.access_duration = duration
        user_course.expires_at = expires_at
        db.commit()
        db.refresh(user_course)
        action_desc = "atualizado"
    else:
        new_uc = UserCourse(
            user_id=student.id,
            course_id=course_id,
            access_duration=duration,
            expires_at=expires_at,
            created_at=now,
        )
        db.add(new_uc)
        db.commit()
        action_desc = "concedido"

    # Propagar itens de combo se o curso for pacote pai
    try:
        from app.services.course_service import grant_bundle_access_for_user
        grant_bundle_access_for_user(db, student.id, course_id, duration, expires_at)
    except Exception as bundle_err:
        logger.warning(f"[FUNNEL #{funnel_id}] Falha ao propagar bundle no Nó {node_id}: {bundle_err}")

    logger.info(f"[FUNNEL #{funnel_id}] Matrícula no curso '{course.title}' ({duration}) {action_desc} para aluno #{student.id}")
    return f"[MATRÍCULA] Acesso {action_desc} ao curso '{course.title}' ({duration}) (Nó {node_id})"


def execute_gamification_xp_node(
    db: Session,
    student: User,
    node_data: Dict[str, Any],
    node_id: str,
    funnel_id: int,
) -> str:
    """Concede pontuação / XP de gamificação diretamente ao aluno."""
    if student.role != "aluno":
        return f"[XP RPG] Ignorado: Usuário #{student.id} não é aluno (Nó {node_id})"

    try:
        xp_amount = int(node_data.get("xp_amount", 50))
    except (ValueError, TypeError):
        xp_amount = 50

    if xp_amount <= 0:
        return f"[XP RPG] Ignorado: Quantidade de XP zerada no Nó {node_id}"

    reason = (node_data.get("reason") or "Recompensa por Conquista no Funil").strip()

    point_entry = GamificationPoint(
        user_id=student.id,
        action="funnel_reward",
        points=xp_amount,
        description=f"{reason} (Funil #{funnel_id})",
        reference_id=funnel_id,
    )
    db.add(point_entry)
    db.commit()

    logger.info(f"[FUNNEL #{funnel_id}] +{xp_amount} XP creditado para o aluno #{student.id} ({reason})")
    return f"[XP RPG] +{xp_amount} XP concedido: '{reason}' (Nó {node_id})"


async def execute_internal_notify_node(
    db: Session,
    student: User,
    node_data: Dict[str, Any],
    node_id: str,
    funnel_id: int,
) -> str:
    """Dispara um alerta / notificação interna para a equipe administrativa sobre o avanço do aluno."""
    raw_message = (node_data.get("message") or "🔔 Alerta de Funil: O aluno {aluno} atingiu uma etapa importante.").strip()
    student_first_name = student.name.split()[0] if student.name else "Aluno"
    final_message = (
        raw_message.replace("{aluno}", student_first_name)
        .replace("{nome}", student.name or "Aluno")
        .replace("{email}", student.email or "")
        .replace("{id}", str(student.id))
    )

    notify_target = node_data.get("notify_target", "admins")
    admin_users = []

    if notify_target == "all_admins" or notify_target == "admins":
        admin_users = db.query(User).filter(
            User.role.in_(["superadmin", "admin"]),
            User.is_active == True,
        ).all()
    else:
        try:
            target_id = int(notify_target)
            admin_users = db.query(User).filter(User.id == target_id, User.is_active == True).all()
        except (ValueError, TypeError):
            admin_users = db.query(User).filter(User.role.in_(["superadmin", "admin"]), User.is_active == True).all()

    if not admin_users:
        return f"[NOTIFICAÇÃO INTERNA] Nenhum administrador ativo encontrado para receber o alerta (Nó {node_id})"

    dispatched_count = 0
    # O remetente do aviso pode ser o próprio sistema (ID do superadmin ou aluno)
    system_sender = db.query(User).filter(User.role == "superadmin", User.is_active == True).first()
    sender_id = system_sender.id if system_sender else student.id

    for admin in admin_users:
        try:
            msg = ChatMessage(
                channel_type="dm",
                user_id=sender_id,
                recipient_id=admin.id,
                message=encrypt_dm_message(f"🔔 [NOTIFICAÇÃO DE FUNIL #{funnel_id}]\n{final_message}"),
                is_read=False,
            )
            db.add(msg)
            db.commit()
            dispatched_count += 1

            try:
                await chat_manager.broadcast_event(
                    event_type="new_dm",
                    data={
                        "recipient_id": admin.id,
                        "sender_id": sender_id,
                        "message_id": msg.id,
                        "text": f"🔔 [NOTIFICAÇÃO DE FUNIL #{funnel_id}]\n{final_message}",
                    },
                    channel_type="dm",
                )
            except Exception as ws_err:
                logger.warning(f"[FUNNEL #{funnel_id}] Falha ao emitir WS de notificação interna: {ws_err}")

        except Exception as msg_err:
            logger.error(f"[FUNNEL #{funnel_id}] Erro ao enviar notificação interna para admin #{admin.id}: {msg_err}")

    return f"[NOTIFICAÇÃO INTERNA] Alerta enviado para {dispatched_count} gestor(es) (Nó {node_id})"
