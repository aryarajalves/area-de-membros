import json
import re
import random
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import desc, func
from fastapi import HTTPException, status

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models.user import User
from app.models.funnel import Funnel, FunnelExecution
from app.models.chat import ChatMessage
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.schemas.funnel import (
    FunnelCreate,
    FunnelUpdate,
    FunnelSummary,
    FunnelDetail,
    FunnelTriggerResponse,
    FunnelExecutionItem,
    FunnelExecutionsResponse,
    ContactActiveFunnelItem,
)
from app.services.chat_ws_manager import chat_manager
from app.services.chat_encryption_service import encrypt_dm_message
from app.services.funnel_tag_processor import execute_tag_node, check_tag_condition_node


def resolve_spintax(text: str) -> str:
    """
    Processa formatação Spintax {Oi|Olá|Bom dia} selecionando uma variação aleatória.
    Preserva tags sem pipe como {aluno} para substituição dinâmica de variáveis.
    """
    if not text:
        return ""
    pattern = re.compile(r"\{([^{}]*\|[^{}]*)\}")
    while pattern.search(text):
        text = pattern.sub(lambda m: random.choice(m.group(1).split("|")), text)
    return text


def _extract_nodes_count(flow_data_str: str) -> int:
    """Extrai a quantidade de nós configurados no fluxo JSON."""
    try:
        data = json.loads(flow_data_str or "{}")
        nodes = data.get("nodes", [])
        return len(nodes)
    except Exception:
        return 0


def normalize_flow_data_nodes(flow_data_str: str) -> str:
    """
    Normaliza o JSON do fluxo garantindo que, se houver nós do tipo 'trigger',
    o primeiro gatilho seja o nó de início (is_start=True) e os demais nós não sejam start.
    Se não houver gatilho, garante que um nó seja o nó inicial.
    """
    try:
        data = json.loads(flow_data_str or "{}")
        nodes = data.get("nodes", [])
        if not nodes:
            return flow_data_str

        has_trigger = any(n.get("type") == "trigger" for n in nodes)
        trigger_ids = {n["id"] for n in nodes if n.get("type") == "trigger"}
        stop_ids = {n["id"] for n in nodes if n.get("type") == "stop"}

        # Regra de negócio:
        # 1. Nós de gatilho são pontos de entrada e nunca podem ser target de conexões.
        # 2. Nós de parada (stop) são terminais e nunca podem ser source de conexões.
        # 3. Relação 1-para-1 estrita por porta: Cada porta de saída só pode se conectar com 1 porta de entrada.
        edges = data.get("edges", [])
        if edges:
            node_ids = {n["id"] for n in nodes if isinstance(n, dict) and "id" in n}
            valid_edges = []
            used_sources = set()
            used_targets = set()
            for e in reversed(edges):
                if not isinstance(e, dict):
                    continue
                src = e.get("source")
                tgt = e.get("target")
                if not src or not tgt or src == tgt:
                    continue
                if src not in node_ids or tgt not in node_ids:
                    continue
                if tgt in trigger_ids or src in stop_ids:
                    continue
                src_port = (src, e.get("sourceHandle") or e.get("source_handle") or "output")
                if src_port in used_sources or tgt in used_targets:
                    continue
                used_sources.add(src_port)
                used_targets.add(tgt)
                valid_edges.append(e)
            data["edges"] = list(reversed(valid_edges))

        if has_trigger:
            trigger_assigned = False
            for n in nodes:
                is_first_trig = (not trigger_assigned) and (n.get("type") == "trigger")
                if is_first_trig:
                    trigger_assigned = True
                if "data" not in n or not isinstance(n["data"], dict):
                    n["data"] = {}
                n["data"]["is_start"] = is_first_trig
        else:
            has_start = any(n.get("data", {}).get("is_start") for n in nodes)
            if not has_start and nodes:
                if "data" not in nodes[0] or not isinstance(nodes[0]["data"], dict):
                    nodes[0]["data"] = {}
                nodes[0]["data"]["is_start"] = True

        return json.dumps(data, ensure_ascii=False)
    except Exception:
        return flow_data_str


def list_funnels(db: Session) -> List[FunnelSummary]:
    """Lista todos os funis de mensagens cadastrados com contadores de nós e execuções."""
    funnels = db.query(Funnel).order_by(desc(Funnel.created_at)).all()
    summaries = []
    for f in funnels:
        exec_count = db.query(func.count(FunnelExecution.id)).filter(FunnelExecution.funnel_id == f.id).scalar() or 0
        summaries.append(
            FunnelSummary(
                id=f.id,
                name=f.name,
                description=f.description,
                trigger_type=f.trigger_type,
                trigger_keywords=f.trigger_keywords,
                is_active=f.is_active,
                nodes_count=_extract_nodes_count(f.flow_data),
                executions_count=exec_count,
                created_at=f.created_at,
                updated_at=f.updated_at,
                created_by_name=f.created_by_user.name if f.created_by_user else None,
            )
        )
    return summaries


def get_funnel_detail(db: Session, funnel_id: int) -> FunnelDetail:
    """Obtém detalhes completos de um funil incluindo seu fluxo JSON."""
    f = db.query(Funnel).filter(Funnel.id == funnel_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")
    return FunnelDetail(
        id=f.id,
        name=f.name,
        description=f.description,
        trigger_type=f.trigger_type,
        trigger_keywords=f.trigger_keywords,
        flow_data=f.flow_data,
        is_active=f.is_active,
        created_at=f.created_at,
        updated_at=f.updated_at,
        created_by_name=f.created_by_user.name if f.created_by_user else None,
    )


def create_funnel(db: Session, current_user: User, data: FunnelCreate) -> FunnelDetail:
    """Cria um novo funil com fluxo padrão inicial de mensagem."""
    # Cria nó inicial se o flow_data estiver vazio
    flow = data.flow_data
    if not flow or flow == "{}":
        default_flow = {
            "nodes": [
                {
                    "id": "node_1",
                    "type": "message",
                    "position": {"x": 250, "y": 150},
                    "data": {
                        "is_start": True,
                        "text": "Olá {aluno|tudo bem?}! Como posso te ajudar hoje?",
                        "buttons": [],
                    },
                }
            ],
            "edges": [],
        }
        flow = json.dumps(default_flow, ensure_ascii=False)

    f = Funnel(
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        trigger_type=data.trigger_type or "chat_button",
        trigger_keywords=data.trigger_keywords.strip() if data.trigger_keywords else None,
        flow_data=normalize_flow_data_nodes(flow),
        is_active=data.is_active,
        created_by_user_id=current_user.id,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return get_funnel_detail(db, f.id)


def update_funnel(db: Session, funnel_id: int, data: FunnelUpdate) -> FunnelDetail:
    """Atualiza o fluxo, nome ou configurações do funil."""
    f = db.query(Funnel).filter(Funnel.id == funnel_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")

    if data.name is not None:
        f.name = data.name.strip()
    if data.description is not None:
        f.description = data.description.strip() if data.description else None
    if data.trigger_type is not None:
        f.trigger_type = data.trigger_type
    if data.trigger_keywords is not None:
        f.trigger_keywords = data.trigger_keywords.strip() if data.trigger_keywords else None
    if data.flow_data is not None:
        f.flow_data = normalize_flow_data_nodes(data.flow_data)
    if data.is_active is not None:
        f.is_active = data.is_active

    f.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(f)
    return get_funnel_detail(db, f.id)


def delete_funnel(db: Session, funnel_id: int) -> bool:
    """Exclui um funil e suas execuções associadas."""
    f = db.query(Funnel).filter(Funnel.id == funnel_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")
    db.delete(f)
    db.commit()
    return True


def duplicate_funnel(db: Session, funnel_id: int, current_user: User) -> FunnelDetail:
    """Duplica um funil existente com um novo nome."""
    f = db.query(Funnel).filter(Funnel.id == funnel_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")

    new_f = Funnel(
        name=f"{f.name} (Cópia)",
        description=f.description,
        trigger_type=f.trigger_type,
        trigger_keywords=f.trigger_keywords,
        flow_data=f.flow_data,
        is_active=f.is_active,
        created_by_user_id=current_user.id,
    )
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return get_funnel_detail(db, new_f.id)


async def execute_funnel_flow(
    funnel_id: int,
    student_id: int,
    sender_id: int,
    button_payload: Optional[str] = None,
    triggered_by: Optional[str] = None,
    execution_id: Optional[int] = None,
    db_session_factory=None,
) -> FunnelTriggerResponse:
    """
    Executa os nós conectados de um funil para um aluno específico em sua conversa DM privada.
    Dispara mensagens, delays e mídias sequencialmente via WebSocket e persiste no banco.
    """
    factory = db_session_factory or SessionLocal
    db: Session = factory()
    try:
        funnel = db.query(Funnel).filter(Funnel.id == funnel_id).first()
        if not funnel:
            return FunnelTriggerResponse(success=False, message="Funil não encontrado.")
        if not funnel.is_active:
            return FunnelTriggerResponse(success=False, message="Funil inativo no momento.")

        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            return FunnelTriggerResponse(success=False, message="Aluno não encontrado.")

        # Obter ou criar registro de execução
        execution = None
        if execution_id:
            execution = db.query(FunnelExecution).filter(FunnelExecution.id == execution_id).first()

        if not execution:
            execution = FunnelExecution(
                funnel_id=funnel_id,
                user_id=student_id,
                triggered_by=triggered_by or ("chat_button" if button_payload else "manual"),
                status="running",
                started_at=datetime.now(timezone.utc),
                logs="",
            )
            db.add(execution)
            db.commit()
            db.refresh(execution)

        # Parsear fluxo de nós e conexões
        try:
            flow = json.loads(funnel.flow_data or "{}")
        except Exception:
            flow = {}

        nodes: List[Dict[str, Any]] = flow.get("nodes", [])
        edges: List[Dict[str, Any]] = flow.get("edges", [])

        if not nodes:
            execution.status = "completed"
            execution.completed_at = datetime.now(timezone.utc)
            db.commit()
            return FunnelTriggerResponse(
                success=True,
                message="Funil executado (nenhum nó cadastrado).",
                execution_id=execution.id,
            )

        # Mapeamento rápido de nós por ID e arestas por porta de origem
        node_map = {n["id"]: n for n in nodes}
        edge_port_map: Dict[Any, str] = {}
        edge_source_map: Dict[str, List[str]] = {}
        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            src_handle = edge.get("sourceHandle") or edge.get("source_handle") or "output"
            if src and tgt:
                edge_port_map[(src, src_handle)] = tgt
                edge_source_map.setdefault(src, []).append(tgt)

        # Identificar nó inicial:
        # Se button_payload apontar para um node_id específico, inicia por ele. Caso contrário busca o gatilho, is_start ou o primeiro nó.
        start_node_id = button_payload if (button_payload and button_payload in node_map) else None
        if not start_node_id:
            # Regra: Se algum gatilho estiver no fluxo, ele é obrigatoriamente o primeiro nó
            for n in nodes:
                if n.get("type") == "trigger":
                    start_node_id = n["id"]
                    break
            if not start_node_id:
                for n in nodes:
                    data = n.get("data", {})
                    if data.get("is_start") or n.get("type") == "start":
                        start_node_id = n["id"]
                        break
            if not start_node_id:
                start_node_id = nodes[0]["id"]

        current_node_id = start_node_id
        visited = set()
        messages_sent = 0
        execution_logs = []

        while current_node_id and current_node_id not in visited:
            visited.add(current_node_id)
            node = node_map.get(current_node_id)
            if not node:
                break

            node_type = node.get("type", "message")
            node_data = node.get("data", {})
            execution.current_node_id = current_node_id

            # Resolver remetente do nó (se configurado especificamente no nó, ou fallback para sender_id padrão)
            effective_sender_id = sender_id
            custom_sender_id = node_data.get("sender_id")
            if custom_sender_id:
                try:
                    c_id = int(custom_sender_id)
                    found_sender = db.query(User).filter(User.id == c_id, User.is_active == True).first()
                    if found_sender:
                        effective_sender_id = found_sender.id
                except (ValueError, TypeError):
                    pass

            if node_type == "trigger":
                trigger_event = node_data.get("trigger_event", "student_created")
                if trigger_event == "course_interest":
                    c_id = node_data.get("course_id")
                    execution_logs.append(f"Gatilho 'Interesse em Curso' iniciado (Curso: {c_id or 'Todos'})")
                else:
                    days_after = int(node_data.get("days_after", 0))
                    execution_logs.append(f"Gatilho '{trigger_event}' iniciado ({days_after} dias)")

            elif node_type == "message":
                raw_text = node_data.get("text", "")
                text_with_name = raw_text.replace("{aluno}", student.name.split()[0] if student.name else "Aluno")
                final_text = resolve_spintax(text_with_name)

                # Botões do nó (se configurados)
                buttons = node_data.get("buttons", [])
                btn_text = None
                btn_url = None
                btn_action = None
                if buttons and len(buttons) > 0:
                    first_btn = buttons[0]
                    btn_text = first_btn.get("text")
                    btn_url = first_btn.get("url") or first_btn.get("target_node_id")
                    btn_action = first_btn.get("action_type", "url")

                # Determinar o destino: DM privada ou Canal da Comunidade
                destination_type = node_data.get("destination_type", "dm")
                target_course_id = node_data.get("target_course_id") or node_data.get("course_id")

                if destination_type == "community_general":
                    ch_type = "general"
                    rec_id = None
                    c_id = None
                    msg_text = final_text
                    log_label = f"Mensagem enviada para Comunidade Geral (Nó {current_node_id})"
                    ws_event = "new_message"
                    ws_data = {
                        "id": None,
                        "channel_type": "general",
                        "course_id": None,
                        "user_id": effective_sender_id,
                        "message": final_text,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "button_text": btn_text,
                        "button_url": btn_url,
                        "button_action_type": btn_action,
                    }
                elif destination_type == "community_course" and target_course_id:
                    ch_type = "course"
                    rec_id = None
                    c_id = int(target_course_id)
                    msg_text = final_text
                    log_label = f"Mensagem enviada para Comunidade no Curso #{c_id} (Nó {current_node_id})"
                    ws_event = "new_message"
                    ws_data = {
                        "id": None,
                        "channel_type": "course",
                        "course_id": c_id,
                        "user_id": effective_sender_id,
                        "message": final_text,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "button_text": btn_text,
                        "button_url": btn_url,
                        "button_action_type": btn_action,
                    }
                else:
                    ch_type = "dm"
                    rec_id = student_id
                    c_id = None
                    msg_text = encrypt_dm_message(final_text)
                    log_label = f"Mensagem enviada (Nó {current_node_id})"
                    ws_event = "new_dm"
                    ws_data = {
                        "recipient_id": student_id,
                        "sender_id": effective_sender_id,
                        "message_id": None,
                        "text": final_text,
                        "button_text": btn_text,
                        "button_url": btn_url,
                        "button_action_type": btn_action,
                    }

                msg = ChatMessage(
                    channel_type=ch_type,
                    course_id=c_id,
                    user_id=effective_sender_id,
                    recipient_id=rec_id,
                    message=msg_text,
                    button_text=btn_text,
                    button_url=btn_url,
                    button_action_type=btn_action,
                    is_read=False,
                )
                db.add(msg)
                db.commit()
                messages_sent += 1

                # Disparar evento WebSocket em tempo real
                try:
                    if ws_event == "new_dm":
                        ws_data["message_id"] = msg.id
                    else:
                        ws_data["id"] = msg.id

                    await chat_manager.broadcast_event(
                        event_type=ws_event,
                        data=ws_data,
                        channel_type=ch_type,
                        course_id=c_id,
                    )
                except Exception as ws_err:
                    logger.warning(f"[FUNNEL #{funnel_id}] Falha ao emitir evento WS: {ws_err}")

                execution_logs.append(log_label)

            elif node_type == "delay":
                from app.services.funnel_logic_node_service import calculate_delay_with_business_hours
                delay_sec, delay_log = calculate_delay_with_business_hours(node_data, current_node_id)
                execution_logs.append(delay_log)
                await asyncio.sleep(min(delay_sec, 60))

            elif node_type == "media":
                media_url = node_data.get("media_url")
                caption = resolve_spintax(node_data.get("caption", ""))
                msg = ChatMessage(
                    channel_type="dm",
                    user_id=effective_sender_id,
                    recipient_id=student_id,
                    message=encrypt_dm_message(caption or "Mídia enviada"),
                    media_url=media_url,
                    media_type="image",
                    is_read=False,
                )
                db.add(msg)
                db.commit()
                messages_sent += 1
                try:
                    await chat_manager.broadcast_event(
                        event_type="new_dm",
                        data={
                            "recipient_id": student_id,
                            "sender_id": effective_sender_id,
                            "message_id": msg.id,
                            "text": caption or "Mídia enviada",
                            "media_url": media_url,
                        },
                        channel_type="dm",
                    )
                except Exception as ws_err:
                    logger.warning(f"[FUNNEL #{funnel_id}] Falha ao emitir evento WS (mídia): {ws_err}")
                execution_logs.append(f"Mídia enviada (Nó {current_node_id})")

            elif node_type == "audio":
                audio_url = node_data.get("audio_url")
                caption = resolve_spintax(node_data.get("caption", ""))
                msg = ChatMessage(
                    channel_type="dm",
                    user_id=effective_sender_id,
                    recipient_id=student_id,
                    message=encrypt_dm_message(caption or "Mensagem de áudio"),
                    media_url=audio_url,
                    media_type="audio",
                    is_read=False,
                )
                db.add(msg)
                db.commit()
                messages_sent += 1
                try:
                    await chat_manager.broadcast_event(
                        event_type="new_dm",
                        data={
                            "recipient_id": student_id,
                            "sender_id": effective_sender_id,
                            "message_id": msg.id,
                            "text": caption or "Mensagem de áudio",
                            "media_url": audio_url,
                        },
                        channel_type="dm",
                    )
                except Exception as ws_err:
                    logger.warning(f"[FUNNEL #{funnel_id}] Falha ao emitir evento WS (áudio): {ws_err}")
                execution_logs.append(f"Áudio enviado (Nó {current_node_id})")

            branch_chosen = None
            if node_type == "tag":
                tag_action = node_data.get("tag_action", "add")
                if tag_action in ["condition", "check"]:
                    condition_passed, tag_log = check_tag_condition_node(db, student_id, node_data, current_node_id, funnel_id)
                    execution_logs.append(tag_log)
                    branch_chosen = "output_yes" if condition_passed else "output_no"
                else:
                    tag_log = execute_tag_node(db, student_id, node_data, current_node_id, funnel_id)
                    execution_logs.append(tag_log)

            elif node_type == "condition_course":
                from app.services.funnel_logic_node_service import execute_course_condition_node
                branch_chosen, course_log = execute_course_condition_node(db, student_id, node_data, current_node_id, funnel_id)
                execution_logs.append(course_log)

            elif node_type == "ab_split":
                from app.services.funnel_logic_node_service import execute_ab_split_node
                branch_chosen, split_log = execute_ab_split_node(node_data, current_node_id, funnel_id)
                execution_logs.append(split_log)

            elif node_type == "stop":
                from app.services.funnel_logic_node_service import execute_stop_node
                _, stop_log = execute_stop_node(db, student_id, node_data, current_node_id, funnel_id, execution.id)
                execution_logs.append(stop_log)
                break

            elif node_type in ["action_webhook", "action_enrollment", "action_gamification_xp", "action_internal_notify"]:
                from app.services.funnel_action_node_service import execute_action_node
                action_log = await execute_action_node(db, student, node_type, node_data, current_node_id, funnel_id)
                execution_logs.append(action_log)

            # Próximo nó na sequência de arestas (respeita bifurcação condicional de portas)
            if branch_chosen:
                next_target = (
                    edge_port_map.get((current_node_id, branch_chosen))
                    or edge_port_map.get((current_node_id, "yes" if branch_chosen == "output_yes" else "no" if branch_chosen == "output_no" else "a" if branch_chosen == "output_a" else "b"))
                )
                current_node_id = next_target
            else:
                next_targets = edge_source_map.get(current_node_id, [])
                current_node_id = next_targets[0] if next_targets else None

        execution.status = "completed"
        execution.completed_at = datetime.now(timezone.utc)
        execution.logs = "\n".join(execution_logs)
        db.commit()

        return FunnelTriggerResponse(
            success=True,
            message="Funil executado com sucesso!",
            execution_id=execution.id,
            messages_dispatched=messages_sent,
        )

    except Exception as exc:
        logger.error(f"[FUNNEL #{funnel_id}] Erro ao executar fluxo: {exc}")
        return FunnelTriggerResponse(success=False, message=f"Erro na execução: {str(exc)}")
    finally:
        db.close()


def get_system_sender_id(db: Session, funnel: Optional[Funnel] = None) -> int:
    """Retorna o ID do usuário remetente do sistema (criador do funil ou superadmin/admin ativo)."""
    if funnel and funnel.created_by_user_id:
        creator = db.query(User).filter(User.id == funnel.created_by_user_id, User.is_active == True).first()
        if creator:
            return creator.id

    admin = db.query(User).filter(User.role.in_(["superadmin", "admin"]), User.is_active == True).order_by(User.id.asc()).first()
    if admin:
        return admin.id

    first_user = db.query(User).filter(User.is_active == True).order_by(User.id.asc()).first()
    return first_user.id if first_user else 1


def dispatch_student_created_funnels(db: Session, student_id: int, db_session_factory=None) -> int:
    """
    Localiza funis ativos que contenham nó do tipo 'trigger' com trigger_event='student_created'
    e days_after=0 (disparo imediato na criação do aluno).
    Agenda a execução assíncrona do funil.
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

            # Registra imediatamente a execução para evitar duplicatas em chamadas sequenciais
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
    """
    Verifica alunos ativos e dispara funis cujo gatilho 'student_created'
    possui days_after > 0 e o tempo decorrido desde a criação do aluno atingiu essa quantidade de dias.
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

                # Registra imediatamente a execução para evitar duplicatas em chamadas sequenciais
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


def dispatch_course_interest_funnels(
    db: Session,
    student_id: int,
    course_id: int,
    db_session_factory=None,
) -> int:
    """
    Localiza funis ativos com gatilho 'course_interest' (Interesse em Curso).
    Valida se o gatilho está configurado para 'Todos os Cursos' ou para o course_id específico.
    Garante execução ÚNICA por aluno (idempotência estrita).
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
            trigger_node = None
            for n in nodes:
                if n.get("type") == "trigger":
                    data = n.get("data", {})
                    if data.get("trigger_event") == "course_interest":
                        target_course = data.get("course_id")
                        # Todos os cursos
                        if target_course in [None, "", "all", "todos", 0]:
                            trigger_node = n
                            break
                        try:
                            if int(target_course) == int(course_id):
                                trigger_node = n
                                break
                        except (ValueError, TypeError):
                            pass

            if not trigger_node:
                continue

            # Regra: acontece 1 ÚNICA VEZ por aluno para este funil
            already_run = db.query(FunnelExecution).filter(
                FunnelExecution.funnel_id == f.id,
                FunnelExecution.user_id == student_id,
            ).first()
            if already_run:
                continue

            # Registra imediatamente a execução para garantir idempotência contra múltiplos cliques
            execution = FunnelExecution(
                funnel_id=f.id,
                user_id=student_id,
                triggered_by=f"trigger_course_interest_{course_id}",
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
                        triggered_by=f"trigger_course_interest_{course_id}",
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
                            triggered_by=f"trigger_course_interest_{course_id}",
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


# ============================================================================
# Re-exports das consultas e histórico de funis (modularizados)
# ============================================================================
from app.services.funnel_execution_query_service import (
    extract_visited_nodes_from_logs,
    get_funnel_executions,
    get_contact_active_funnels,
)
from app.services.funnel_trigger_service import (
    dispatch_progress_milestone_funnels,
    dispatch_renewal_warning_funnels,
    dispatch_student_inactivity_funnels,
)




