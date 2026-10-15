import pytest
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.models.user import User
from tests.conftest import TestingSessionLocal
from app.services.funnel_tag_processor import (
    evaluate_tag_condition,
    execute_tag_node,
    get_student_tag_ids,
)


def test_evaluate_tag_condition_logic():
    # Cenário 1: has_tags com AND
    current = {10, 20, 30}
    # Possui todas {10, 20}
    met, desc = evaluate_tag_condition(current, "has_tags", [10, 20], "AND")
    assert met is True

    # Falta a tag 40
    met, desc = evaluate_tag_condition(current, "has_tags", [10, 40], "AND")
    assert met is False

    # Cenário 2: has_tags com OR
    # Possui pelo menos a tag 10
    met, desc = evaluate_tag_condition(current, "has_tags", [10, 40], "OR")
    assert met is True

    # Não possui nem 40 nem 50
    met, desc = evaluate_tag_condition(current, "has_tags", [40, 50], "OR")
    assert met is False

    # Cenário 3: not_has_tags com AND
    # Não possui nenhuma entre {40, 50}
    met, desc = evaluate_tag_condition(current, "not_has_tags", [40, 50], "AND")
    assert met is True

    # Possui a tag 10, então falha no AND
    met, desc = evaluate_tag_condition(current, "not_has_tags", [10, 40], "AND")
    assert met is False

    # Cenário 4: not_has_tags com OR
    # Pelo menos a tag 40 ele NÃO possui
    met, desc = evaluate_tag_condition(current, "not_has_tags", [10, 40], "OR")
    assert met is True

    # Possui tanto 10 quanto 20, então nenhuma está livre
    met, desc = evaluate_tag_condition(current, "not_has_tags", [10, 20], "OR")
    assert met is False


def test_execute_tag_node_add_and_remove():
    db = TestingSessionLocal()
    try:
        student = User(
            email="tag_student_test@example.com",
            name="Aluno Teste Tag",
            hashed_password="fake_hashed_pass",
            role="student",
            is_active=True,
        )
        db.add(student)
        db.commit()

        tag_vip = StudentTag(name="VIP_Test", color="#eab308")
        tag_lead = StudentTag(name="Lead_Test", color="#3b82f6")
        tag_churn = StudentTag(name="Churn_Test", color="#ef4444")
        db.add_all([tag_vip, tag_lead, tag_churn])
        db.commit()

        # 1. Adicionar tag VIP sem condição
        node_data_add = {"tag_action": "add", "tag_id": tag_vip.id}
        res_add = execute_tag_node(db, student.id, node_data_add, "node_1", 1)
        assert "adicionada" in res_add.lower()

        # Verificar se foi persistida
        tags = get_student_tag_ids(db, student.id)
        assert tag_vip.id in tags

        # Adicionar novamente (idempotência)
        res_add_again = execute_tag_node(db, student.id, node_data_add, "node_1", 1)
        assert "já possuía" in res_add_again.lower()

        # 2. Adicionar tag Lead com condição NÃO satisfeita (exige tag Churn_Test via AND)
        node_data_cond_fail = {
            "tag_action": "add",
            "tag_id": tag_lead.id,
            "has_condition": True,
            "condition_mode": "has_tags",
            "condition_tag_ids": [tag_churn.id],
            "condition_operator": "AND",
        }
        res_fail = execute_tag_node(db, student.id, node_data_cond_fail, "node_2", 1)
        assert "não atendida" in res_fail.lower()
        tags_after = get_student_tag_ids(db, student.id)
        assert tag_lead.id not in tags_after

        # 3. Adicionar tag Lead com condição SATISFEITA (possui tag VIP_Test via OR)
        node_data_cond_success = {
            "tag_action": "add",
            "tag_id": tag_lead.id,
            "has_condition": True,
            "condition_mode": "has_tags",
            "condition_tag_ids": [tag_vip.id, tag_churn.id],
            "condition_operator": "OR",
        }
        res_success = execute_tag_node(db, student.id, node_data_cond_success, "node_3", 1)
        assert "adicionada" in res_success.lower()
        tags_now = get_student_tag_ids(db, student.id)
        assert tag_lead.id in tags_now

        # 4. Remover tag VIP
        node_data_remove = {"tag_action": "remove", "tag_id": tag_vip.id}
        res_rem = execute_tag_node(db, student.id, node_data_remove, "node_4", 1)
        assert "removida" in res_rem.lower()

        tags_final = get_student_tag_ids(db, student.id)
        assert tag_vip.id not in tags_final
        assert tag_lead.id in tags_final

        # Remover novamente tag que já não possui
        res_rem_again = execute_tag_node(db, student.id, node_data_remove, "node_4", 1)
        assert "não possuía" in res_rem_again.lower()
    finally:
        db.close()


def test_check_tag_condition_node_branching():
    db = TestingSessionLocal()
    try:
        student = User(
            email="branch_student@example.com",
            name="Aluno Bifurcação",
            hashed_password="fake_hashed_pass",
            role="student",
            is_active=True,
        )
        db.add(student)
        db.commit()

        tag_pro = StudentTag(name="PRO_Member", color="#10b981")
        tag_lite = StudentTag(name="LITE_Member", color="#3b82f6")
        db.add_all([tag_pro, tag_lite])
        db.commit()

        # Vincula apenas a tag PRO ao aluno
        db.add(StudentTagAssignment(student_id=student.id, tag_id=tag_pro.id))
        db.commit()

        # Cenário 1: Verifica se tem a tag PRO -> deve retornar True e ramo SIM
        node_check_pro = {
            "tag_action": "condition",
            "condition_mode": "has_tags",
            "condition_tag_ids": [tag_pro.id],
            "condition_operator": "AND",
        }
        from app.services.funnel_tag_processor import check_tag_condition_node
        passed_pro, log_pro = check_tag_condition_node(db, student.id, node_check_pro, "check_1", 10)
        assert passed_pro is True
        assert "SIM" in log_pro

        # Cenário 2: Verifica se tem a tag LITE -> deve retornar False e ramo NÃO
        node_check_lite = {
            "tag_action": "condition",
            "condition_mode": "has_tags",
            "condition_tag_ids": [tag_lite.id],
            "condition_operator": "AND",
        }
        passed_lite, log_lite = check_tag_condition_node(db, student.id, node_check_lite, "check_2", 10)
        assert passed_lite is False
        assert "NÃO" in log_lite
    finally:
        db.close()


@pytest.mark.asyncio
async def test_funnel_conditional_tag_node_flow_execution():
    """
    Testa a execução de um funil com nó de tag condicional e 2 saídas (SIM e NÃO).
    Verifica se o aluno segue estritamente o ramo correto com base em suas tags.
    """
    import json
    from app.models.funnel import Funnel, FunnelExecution
    from app.services.funnel_service import execute_funnel_flow

    db = TestingSessionLocal()
    try:
        admin = User(
            email="admin_branch@example.com",
            name="Admin Branch",
            hashed_password="fake",
            role="superadmin",
            is_active=True,
        )
        student_with_tag = User(
            email="student_with_vip@example.com",
            name="Aluno VIP",
            hashed_password="fake",
            role="student",
            is_active=True,
        )
        student_without_tag = User(
            email="student_without_vip@example.com",
            name="Aluno Não VIP",
            hashed_password="fake",
            role="student",
            is_active=True,
        )
        db.add_all([admin, student_with_tag, student_without_tag])
        db.commit()

        vip_tag = StudentTag(name="TAG_VIP_TEST", color="#a855f7")
        db.add(vip_tag)
        db.commit()

        # Vincula a tag apenas ao primeiro aluno
        db.add(StudentTagAssignment(student_id=student_with_tag.id, tag_id=vip_tag.id))
        db.commit()

        flow = {
            "nodes": [
                {
                    "id": "node_cond",
                    "type": "tag",
                    "data": {
                        "is_start": True,
                        "tag_action": "condition",
                        "condition_mode": "has_tags",
                        "condition_tag_ids": [vip_tag.id],
                        "condition_operator": "AND",
                    },
                },
                {
                    "id": "node_msg_yes",
                    "type": "message",
                    "data": {"text": "Olá VIP, você tem acesso especial!"},
                },
                {
                    "id": "node_msg_no",
                    "type": "message",
                    "data": {"text": "Olá, torne-se VIP hoje mesmo!"},
                },
            ],
            "edges": [
                {
                    "id": "edge_yes",
                    "source": "node_cond",
                    "sourceHandle": "output_yes",
                    "target": "node_msg_yes",
                },
                {
                    "id": "edge_no",
                    "source": "node_cond",
                    "sourceHandle": "output_no",
                    "target": "node_msg_no",
                },
            ],
        }

        funnel = Funnel(
            name="Funil com Nó de Verificação Condicional",
            flow_data=json.dumps(flow),
            is_active=True,
            created_by_user_id=admin.id,
        )
        db.add(funnel)
        db.commit()
        funnel_id = funnel.id
        admin_id = admin.id
        s_with_id = student_with_tag.id
        s_without_id = student_without_tag.id
    finally:
        db.close()

    # 1. Executa para o aluno COM a tag VIP -> deve percorrer ramo SIM (node_msg_yes)
    res_vip = await execute_funnel_flow(
        funnel_id=funnel_id,
        student_id=s_with_id,
        sender_id=admin_id,
        db_session_factory=TestingSessionLocal,
    )
    assert res_vip.success is True

    db_check = TestingSessionLocal()
    exec_vip = db_check.query(FunnelExecution).filter_by(funnel_id=funnel_id, user_id=s_with_id).first()
    assert "resultado 'SIM'" in (exec_vip.logs or "")
    assert "(Nó node_msg_yes)" in (exec_vip.logs or "")
    assert "(Nó node_msg_no)" not in (exec_vip.logs or "")

    # 2. Executa para o aluno SEM a tag VIP -> deve percorrer ramo NÃO (node_msg_no)
    res_novip = await execute_funnel_flow(
        funnel_id=funnel_id,
        student_id=s_without_id,
        sender_id=admin_id,
        db_session_factory=TestingSessionLocal,
    )
    assert res_novip.success is True

    exec_novip = db_check.query(FunnelExecution).filter_by(funnel_id=funnel_id, user_id=s_without_id).first()
    assert "resultado 'NÃO'" in (exec_novip.logs or "")
    assert "(Nó node_msg_no)" in (exec_novip.logs or "")
    assert "(Nó node_msg_yes)" not in (exec_novip.logs or "")
    db_check.close()


