import json
import re
import random
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import HTTPException, status

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models.user import User
from app.models.funnel import Funnel, FunnelExecution
from app.models.chat import ChatMessage
from app.schemas.funnel import (
    FunnelCreate,
    FunnelUpdate,
    FunnelSummary,
    FunnelDetail,
    FunnelTriggerResponse,
)
from app.services.chat_ws_manager import chat_manager


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
        flow_data=flow,
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
        f.flow_data = data.flow_data
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

        # Criar registro de execução
        execution = FunnelExecution(
            funnel_id=funnel_id,
            user_id=student_id,
            triggered_by="chat_button" if button_payload else "manual",
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

        # Mapeamento rápido de nós por ID e arestas por nó de origem
        node_map = {n["id"]: n for n in nodes}
        edge_map: Dict[str, List[str]] = {}
        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src and tgt:
                edge_map.setdefault(src, []).append(tgt)

        # Identificar nó inicial:
        # Se button_payload apontar para um node_id específico, inicia por ele. Caso contrário busca is_start ou o primeiro nó.
        start_node_id = button_payload if (button_payload and button_payload in node_map) else None
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

            if node_type == "message":
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

                # Salvar mensagem no chat DM
                msg = ChatMessage(
                    channel_type="dm",
                    user_id=sender_id,
                    recipient_id=student_id,
                    message=final_text,
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
                    await chat_manager.broadcast_event(
                        event_type="new_dm",
                        data={
                            "recipient_id": student_id,
                            "sender_id": sender_id,
                            "message_id": msg.id,
                            "text": final_text,
                            "button_text": btn_text,
                            "button_url": btn_url,
                            "button_action_type": btn_action,
                        },
                        channel_type="dm",
                    )
                except Exception as ws_err:
                    logger.warning(f"[FUNNEL #{funnel_id}] Falha ao emitir evento WS: {ws_err}")

                execution_logs.append(f"Mensagem enviada (Nó {current_node_id})")

            elif node_type == "delay":
                delay_sec = int(node_data.get("delay_seconds", 2))
                execution_logs.append(f"Aguardando delay de {delay_sec}s (Nó {current_node_id})")
                await asyncio.sleep(min(delay_sec, 60))

            elif node_type == "media":
                media_url = node_data.get("media_url")
                caption = resolve_spintax(node_data.get("caption", ""))
                msg = ChatMessage(
                    channel_type="dm",
                    user_id=sender_id,
                    recipient_id=student_id,
                    message=caption or "Mídia enviada",
                    file_url=media_url,
                    is_read=False,
                )
                db.add(msg)
                db.commit()
                messages_sent += 1
                execution_logs.append(f"Mídia enviada (Nó {current_node_id})")

            elif node_type == "audio":
                audio_url = node_data.get("audio_url")
                caption = resolve_spintax(node_data.get("caption", ""))
                msg = ChatMessage(
                    channel_type="dm",
                    user_id=sender_id,
                    recipient_id=student_id,
                    message=caption or "Mensagem de áudio",
                    file_url=audio_url,
                    is_read=False,
                )
                db.add(msg)
                db.commit()
                messages_sent += 1
                execution_logs.append(f"Áudio enviado (Nó {current_node_id})")

            # Próximo nó na sequência de arestas
            next_targets = edge_map.get(current_node_id, [])
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
