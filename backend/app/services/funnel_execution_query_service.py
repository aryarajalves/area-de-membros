import re
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.funnel import Funnel, FunnelExecution
from app.schemas.funnel import (
    FunnelExecutionItem,
    FunnelExecutionsResponse,
    ContactActiveFunnelItem,
)


def extract_visited_nodes_from_logs(logs: Optional[str], current_node_id: Optional[str]) -> List[str]:
    """Extrai os IDs dos nós visitados a partir do histórico de logs estruturados da execução."""
    visited: List[str] = []
    if logs:
        matches = re.findall(r"\(Nó\s+([a-zA-Z0-9_\-]+)\)", logs)
        for m in matches:
            if m not in visited:
                visited.append(m)
    if current_node_id and current_node_id not in visited:
        visited.append(current_node_id)
    return visited


def get_funnel_executions(
    db: Session,
    funnel_id: int,
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
) -> FunnelExecutionsResponse:
    """Retorna o histórico de execuções de um funil com metadados dos nós e progresso de cada contato."""
    funnel = db.query(Funnel).filter(Funnel.id == funnel_id).first()
    if not funnel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")

    try:
        flow = json.loads(funnel.flow_data or "{}")
    except Exception:
        flow = {}

    nodes = flow.get("nodes", [])
    edges = flow.get("edges", [])

    query = db.query(FunnelExecution).filter(FunnelExecution.funnel_id == funnel_id)
    if student_id:
        query = query.filter(FunnelExecution.user_id == student_id)
    if status_filter:
        query = query.filter(FunnelExecution.status == status_filter)

    executions_db = query.order_by(FunnelExecution.started_at.desc()).all()

    total_executions = len(executions_db)
    running_count = sum(1 for e in executions_db if e.status == "running")
    completed_count = sum(1 for e in executions_db if e.status == "completed")

    items = []
    for ex in executions_db:
        st = ex.user
        student_name = st.name if st else f"Contato #{ex.user_id}"
        student_email = st.email if st else None
        student_avatar = getattr(st, "avatar_url", None)
        visited = extract_visited_nodes_from_logs(ex.logs, ex.current_node_id)

        items.append(
            FunnelExecutionItem(
                id=ex.id,
                funnel_id=funnel.id,
                funnel_name=funnel.name,
                user_id=ex.user_id,
                student_name=student_name,
                student_email=student_email,
                student_avatar=student_avatar,
                triggered_by=ex.triggered_by,
                current_node_id=ex.current_node_id,
                status=ex.status,
                started_at=ex.started_at,
                completed_at=ex.completed_at,
                logs=ex.logs,
                visited_nodes=visited,
            )
        )

    return FunnelExecutionsResponse(
        funnel_id=funnel.id,
        funnel_name=funnel.name,
        flow_nodes=nodes,
        flow_edges=edges,
        total_executions=total_executions,
        running_count=running_count,
        completed_count=completed_count,
        executions=items,
    )


def get_contact_active_funnels(db: Session, student_id: int) -> List[ContactActiveFunnelItem]:
    """Retorna os funis ativos e concluídos nos quais um contato específico está inscrito."""
    executions = (
        db.query(FunnelExecution)
        .filter(FunnelExecution.user_id == student_id)
        .order_by(FunnelExecution.started_at.desc())
        .all()
    )

    results = []
    for ex in executions:
        fn = ex.funnel
        if not fn:
            continue
        try:
            flow = json.loads(fn.flow_data or "{}")
        except Exception:
            flow = {}

        nodes = flow.get("nodes", [])
        total_nodes = len(nodes)
        node_map = {n.get("id"): n for n in nodes}
        curr_node = node_map.get(ex.current_node_id) if ex.current_node_id else None
        curr_type = curr_node.get("type") if curr_node else None

        visited = extract_visited_nodes_from_logs(ex.logs, ex.current_node_id)
        progress = int((len(visited) / max(total_nodes, 1)) * 100) if total_nodes > 0 else 100

        results.append(
            ContactActiveFunnelItem(
                execution_id=ex.id,
                funnel_id=fn.id,
                funnel_name=fn.name,
                triggered_by=ex.triggered_by,
                status=ex.status,
                current_node_id=ex.current_node_id,
                current_node_type=curr_type,
                started_at=ex.started_at,
                completed_at=ex.completed_at,
                progress_percentage=min(progress, 100),
                visited_nodes_count=len(visited),
                total_nodes_count=total_nodes,
            )
        )

    return results
