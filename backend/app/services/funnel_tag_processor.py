"""
Módulo de processamento de nós de tag para funis de mensagens.
Suporta adição, remoção e avaliação de condições lógicas (AND/OR).
"""

from typing import List, Set, Tuple
from sqlalchemy.orm import Session
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.core.logger import logger


def get_student_tag_ids(db: Session, student_id: int) -> Set[int]:
    """Retorna conjunto com os IDs de todas as tags vinculadas ao aluno."""
    rows = (
        db.query(StudentTagAssignment.tag_id)
        .filter(StudentTagAssignment.student_id == student_id)
        .all()
    )
    return {r[0] for r in rows if r[0] is not None}


def evaluate_tag_condition(
    current_tag_ids: Set[int],
    condition_mode: str,
    target_tag_ids: List[int],
    operator: str = "AND",
) -> Tuple[bool, str]:
    """
    Avalia se as tags atuais do aluno atendem à condição configurada no nó.
    
    condition_mode:
        - 'has_tags': o lead deve possuir a(s) etiqueta(s)
        - 'not_has_tags': o lead NÃO deve possuir a(s) etiqueta(s)
    
    operator:
        - 'AND': todas as tags da lista devem cumprir o critério
        - 'OR': pelo menos uma tag da lista deve cumprir o critério
    """
    valid_target_ids = [int(t) for t in target_tag_ids if str(t).isdigit()]
    if not valid_target_ids:
        return True, "Sem tags de condição informadas"

    op = operator.upper() if operator else "AND"
    mode = condition_mode or "has_tags"

    if mode == "has_tags":
        if op == "AND":
            met = all(t in current_tag_ids for t in valid_target_ids)
            desc = "Possui TODAS as tags exigidas" if met else "Não possui todas as tags exigidas"
        else:  # OR
            met = any(t in current_tag_ids for t in valid_target_ids)
            desc = "Possui pelo menos uma das tags exigidas" if met else "Não possui nenhuma das tags exigidas"
    else:  # not_has_tags
        if op == "AND":
            met = all(t not in current_tag_ids for t in valid_target_ids)
            desc = "Não possui nenhuma das tags restritas" if met else "Possui alguma das tags restritas"
        else:  # OR
            met = any(t not in current_tag_ids for t in valid_target_ids)
            desc = "Está livre de pelo menos uma das tags restritas" if met else "Possui todas as tags restritas"

    return met, desc


def check_tag_condition_node(
    db: Session,
    student_id: int,
    node_data: dict,
    current_node_id: str,
    funnel_id: int,
) -> Tuple[bool, str]:
    """
    Avalia a condição do nó de tag quando configurado no modo 'condition' / 'check'.
    Retorna (condition_met: bool, log_msg: str).
    """
    current_tags = get_student_tag_ids(db, student_id)
    cond_mode = node_data.get("condition_mode", "has_tags")
    # Tags a verificar: suporta condition_tag_ids, tag_ids ou tag_id único
    cond_tag_ids = node_data.get("condition_tag_ids") or node_data.get("tag_ids") or []
    if not cond_tag_ids and node_data.get("tag_id"):
        cond_tag_ids = [node_data.get("tag_id")]

    cond_operator = node_data.get("condition_operator", "AND")

    condition_met, cond_reason = evaluate_tag_condition(
        current_tag_ids=current_tags,
        condition_mode=cond_mode,
        target_tag_ids=cond_tag_ids,
        operator=cond_operator,
    )

    result_branch = "SIM" if condition_met else "NÃO"
    log_msg = (
        f"Verificação de Tags ({cond_reason}): resultado '{result_branch}' "
        f"ao contato #{student_id} (Nó {current_node_id})"
    )
    logger.info(f"[FUNNEL #{funnel_id}] {log_msg}")
    return condition_met, log_msg


def execute_tag_node(
    db: Session,
    student_id: int,
    node_data: dict,
    current_node_id: str,
    funnel_id: int,
) -> str:
    """
    Executa a ação do nó de Tag (Adicionar ou Remover), respeitando a condição prévia se configurada.
    """
    action = node_data.get("tag_action", "add")
    tag_id_raw = node_data.get("tag_id")
    has_condition = bool(node_data.get("has_condition", False))

    current_tags = get_student_tag_ids(db, student_id)

    # 1. Avaliação Condicional Prévia (caso configurada em nó de ação)
    if has_condition:
        cond_mode = node_data.get("condition_mode", "has_tags")
        cond_tag_ids = node_data.get("condition_tag_ids", [])
        cond_operator = node_data.get("condition_operator", "AND")

        condition_met, cond_reason = evaluate_tag_condition(
            current_tag_ids=current_tags,
            condition_mode=cond_mode,
            target_tag_ids=cond_tag_ids,
            operator=cond_operator,
        )

        if not condition_met:
            log_msg = (
                f"Condição de tags não atendida ({cond_reason}) ao contato #{student_id} "
                f"(Nó {current_node_id}). Ação de '{action}' ignorada, fluxo segue normalmente."
            )
            logger.info(f"[FUNNEL #{funnel_id}] {log_msg}")
            return log_msg

    # 2. Resolução das Tags a serem processadas (suporta lista tag_ids e fallback legado tag_id)
    raw_tag_ids = node_data.get("tag_ids")
    if raw_tag_ids is None or not isinstance(raw_tag_ids, list):
        single_tag = node_data.get("tag_id")
        raw_tag_ids = [single_tag] if single_tag is not None else []

    target_ids = []
    for tid in raw_tag_ids:
        try:
            if tid is not None and str(tid).strip().isdigit():
                target_ids.append(int(tid))
        except (ValueError, TypeError):
            continue

    if not target_ids:
        return f"Nenhuma tag configurada para {action} (Nó {current_node_id})"

    action_results = []
    for t_id in target_ids:
        tag_obj = db.query(StudentTag).filter(StudentTag.id == t_id).first()
        if not tag_obj:
            action_results.append(f"Tag ID {t_id} não encontrada")
            continue

        if action == "remove":
            assignment = (
                db.query(StudentTagAssignment)
                .filter(
                    StudentTagAssignment.student_id == student_id,
                    StudentTagAssignment.tag_id == t_id,
                )
                .first()
            )
            if assignment:
                db.delete(assignment)
                db.commit()
                action_results.append(f"Tag '{tag_obj.name}' removida")
            else:
                action_results.append(f"Contato já não possuía a tag '{tag_obj.name}'")
        else:  # 'add'
            existing = (
                db.query(StudentTagAssignment)
                .filter(
                    StudentTagAssignment.student_id == student_id,
                    StudentTagAssignment.tag_id == t_id,
                )
                .first()
            )
            if not existing:
                new_assign = StudentTagAssignment(student_id=student_id, tag_id=t_id)
                db.add(new_assign)
                db.commit()
                action_results.append(f"Tag '{tag_obj.name}' adicionada")
            else:
                action_results.append(f"Contato já possuía a tag '{tag_obj.name}'")

    summary_log = f"{', '.join(action_results)} ao contato #{student_id} (Nó {current_node_id})"
    logger.info(f"[FUNNEL #{funnel_id}] {summary_log}")
    return summary_log
