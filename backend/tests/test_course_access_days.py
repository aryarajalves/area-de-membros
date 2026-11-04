import json
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.course import Course, UserCourse
from app.models.user import User, RegistrationVerification
from app.models.funnel import Funnel, FunnelExecution
from app.services.course_access_utils import (
    calculate_course_expiration,
    ACCESS_DURATION_DAYS,
    is_short_trial_access,
)
from app.services.funnel_trigger_service import dispatch_renewal_warning_funnels
from app.services.student_import_export import normalize_duration
from tests.conftest import TestingSessionLocal

client = TestClient(app)


def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_calculate_course_expiration_1_to_7_days():
    base = datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)

    expected_map = {
        "1_day": 1,
        "2_days": 2,
        "3_days": 3,
        "4_days": 4,
        "5_days": 5,
        "6_days": 6,
        "7_days": 7,
    }

    for duration_key, days in expected_map.items():
        assert ACCESS_DURATION_DAYS.get(duration_key) == days
        exp = calculate_course_expiration(duration_key, base_time=base)
        assert exp == base + timedelta(days=days)


def test_normalize_duration_1_to_7_days():
    assert normalize_duration("1 dia") == "1_day"
    assert normalize_duration("1_day") == "1_day"
    assert normalize_duration("2 dias") == "2_days"
    assert normalize_duration("3 dias") == "3_days"
    assert normalize_duration("4 dias") == "4_days"
    assert normalize_duration("5 dias") == "5_days"
    assert normalize_duration("6 dias") == "6_days"
    assert normalize_duration("7 dias") == "7_days"
    assert normalize_duration("7_days") == "7_days"


def test_invite_and_register_with_short_trial_days():
    headers = get_superadmin_headers()
    db = TestingSessionLocal()

    course = Course(title="Curso Degustação 3 Dias", description="Teste de acesso curto")
    db.add(course)
    db.commit()
    db.refresh(course)
    course_id = course.id
    db.close()

    # 1. Superadmin gera convite liberando o curso por 3 dias ('3_days')
    invite_res = client.post(
        "/api/v1/auth/invites",
        json={
            "role": "aluno",
            "duration_hours": 24,
            "allowed_course_ids": [course_id],
            "course_access": [
                {"course_id": course_id, "access_duration": "3_days"}
            ]
        },
        headers=headers
    )
    assert invite_res.status_code == 201
    invite_data = invite_res.json()
    assert len(invite_data["course_access"]) == 1
    assert invite_data["course_access"][0]["course_id"] == course_id
    assert invite_data["course_access"][0]["access_duration"] == "3_days"
    invite_token = invite_data["token"]

    # 2. Lead inicia cadastro com o link de convite
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "token": invite_token,
            "name": "Lead Em Cima do Muro",
            "email": "lead_trial_3days@teste.com",
            "phone": "+55 (11) 99999-1122",
            "password": "Password@123456",
            "password_confirm": "Password@123456"
        }
    )
    assert reg_res.status_code == 200
    assert reg_res.json()["requires_verification"] is True

    # 2.1 Confirma OTP e cria a conta
    db = TestingSessionLocal()
    verif = db.query(RegistrationVerification).filter(
        RegistrationVerification.email == "lead_trial_3days@teste.com",
        RegistrationVerification.is_used == False
    ).first()
    assert verif is not None
    otp_code = verif.code
    db.close()

    now_before = datetime.now(timezone.utc)
    verify_res = client.post(
        "/api/v1/auth/register/verify",
        json={
            "email": "lead_trial_3days@teste.com",
            "code": otp_code
        }
    )
    assert verify_res.status_code == 201

    # 3. Verifica no banco se o acesso ao curso tem duração '3_days' e expira em ~3 dias
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "lead_trial_3days@teste.com").first()
    assert user is not None
    user_id = user.id
    uc = db.query(UserCourse).filter(
        UserCourse.user_id == user.id,
        UserCourse.course_id == course_id
    ).first()
    assert uc is not None
    assert uc.access_duration == "3_days"
    assert uc.expires_at is not None

    exp_utc = uc.expires_at if uc.expires_at.tzinfo else uc.expires_at.replace(tzinfo=timezone.utc)
    diff_days = (exp_utc - now_before).total_seconds() / 86400.0
    assert 2.95 <= diff_days <= 3.05
    db.close()

    # 4. Superadmin edita o aluno alterando para 7 dias ('7_days')
    now_update = datetime.now(timezone.utc)
    upd_res = client.patch(
        f"/api/v1/auth/users/{user_id}",
        json={
            "role": "aluno",
            "course_ids": [course_id],
            "course_access": [
                {"course_id": course_id, "access_duration": "7_days"}
            ]
        },
        headers=headers
    )
    assert upd_res.status_code == 200

    db = TestingSessionLocal()
    uc_updated = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == course_id
    ).first()
    assert uc_updated is not None
    assert uc_updated.access_duration == "7_days"
    exp_upd_utc = uc_updated.expires_at if uc_updated.expires_at.tzinfo else uc_updated.expires_at.replace(tzinfo=timezone.utc)
    diff_days_7 = (exp_upd_utc - now_update).total_seconds() / 86400.0
    assert 6.95 <= diff_days_7 <= 7.05
    db.close()


def test_is_short_trial_access_helper():
    base = datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)
    for key in ["1_day", "2_days", "3_days", "4_days", "5_days", "6_days", "7_days"]:
        uc = UserCourse(
            user_id=1,
            course_id=1,
            access_duration=key,
            created_at=base,
            expires_at=calculate_course_expiration(key, base_time=base)
        )
        assert is_short_trial_access(uc) is True

    for key in ["1_month", "3_months", "6_months", "1_year", "2_years", "3_years", "lifetime"]:
        uc = UserCourse(
            user_id=1,
            course_id=1,
            access_duration=key,
            created_at=base,
            expires_at=calculate_course_expiration(key, base_time=base)
        )
        assert is_short_trial_access(uc) is False


def test_renewal_warning_funnel_blocked_for_short_trial_1_to_7_days():
    db = TestingSessionLocal()

    course = Course(title="Curso Teste Funil Expiração", description="Valida bloqueio 1 a 7 dias")
    db.add(course)
    db.commit()
    db.refresh(course)

    student = User(
        name="Aluno Degustação",
        email="aluno_degustacao_funil@teste.com",
        phone="5511988887777",
        hashed_password=get_password_hash("Password@123"),
        role="aluno",
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Cria Funil com gatilho de Aviso de Expiração para 7 dias, 3 dias e 0 dias (no vencimento)
    for days_target in (7, 3, 0):
        flow_data = {
            "nodes": [
                {
                    "id": f"trigger_renewal_{days_target}",
                    "type": "trigger",
                    "data": {
                        "trigger_event": "renewal_warning",
                        "days_before": days_target,
                        "course_id": course.id,
                    },
                },
                {
                    "id": f"msg_renewal_{days_target}",
                    "type": "message",
                    "data": {
                        "text": f"Seu curso expira em {days_target} dias!",
                    },
                },
            ],
            "edges": [
                {"id": f"e_r_{days_target}", "source": f"trigger_renewal_{days_target}", "target": f"msg_renewal_{days_target}"},
            ],
        }
        f = Funnel(
            name=f"Funil Expiração {days_target}d",
            flow_data=json.dumps(flow_data),
            is_active=True
        )
        db.add(f)
    db.commit()

    # 1. Aluno com 1_day, 3_days, 5_days ou 7_days NÃO deve disparar nenhum funil de expiração
    now = datetime.now(timezone.utc)
    uc = UserCourse(
        user_id=student.id,
        course_id=course.id,
        access_duration="5_days",
        created_at=now,
        expires_at=now + timedelta(days=5)
    )
    db.add(uc)
    db.commit()

    for duration_key in ("1_day", "3_days", "5_days", "7_days"):
        uc.access_duration = duration_key
        uc.expires_at = now + timedelta(days=ACCESS_DURATION_DAYS[duration_key])
        db.commit()

        assert dispatch_renewal_warning_funnels(db, student_id=student.id, course_id=course.id, days_before=7) == 0
        assert dispatch_renewal_warning_funnels(db, student_id=student.id, course_id=course.id, days_before=3) == 0
        assert dispatch_renewal_warning_funnels(db, student_id=student.id, course_id=course.id, days_before=0) == 0

    runs_count = db.query(FunnelExecution).filter(FunnelExecution.user_id == student.id).count()
    assert runs_count == 0

    # 2. Quando o aluno passa a ter acesso de 1 mês ('1_month'), o gatilho ativa normalmente
    uc.access_duration = "1_month"
    uc.expires_at = now + timedelta(days=30)
    db.commit()

    triggered_7 = dispatch_renewal_warning_funnels(db, student_id=student.id, course_id=course.id, days_before=7)
    triggered_3 = dispatch_renewal_warning_funnels(db, student_id=student.id, course_id=course.id, days_before=3)
    triggered_0 = dispatch_renewal_warning_funnels(db, student_id=student.id, course_id=course.id, days_before=0)

    assert triggered_7 == 1
    assert triggered_3 == 1
    assert triggered_0 == 1
    db.close()


def test_admin_role_can_access_user_management_and_invites_with_superadmin_protection():
    db = TestingSessionLocal()
    superadmin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
    superadmin_id = superadmin.id

    admin_user = User(
        name="Admin Gestor",
        email="admin_gestor_usuarios@teste.com",
        hashed_password=get_password_hash("Admin@123456"),
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.close()

    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin_gestor_usuarios@teste.com",
        "password": "Admin@123456"
    })
    assert login_res.status_code == 200
    admin_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # 1. Admin pode listar usuários
    users_res = client.get("/api/v1/auth/users", headers=admin_headers)
    assert users_res.status_code == 200
    assert isinstance(users_res.json(), list)

    # 2. Admin pode criar e listar convites
    inv_create = client.post(
        "/api/v1/auth/invites",
        json={"role": "aluno", "duration_hours": 24, "allowed_course_ids": []},
        headers=admin_headers
    )
    assert inv_create.status_code == 201

    inv_list = client.get("/api/v1/auth/invites", headers=admin_headers)
    assert inv_list.status_code == 200

    # 3. Admin NÃO pode editar ou deletar o Super Admin (protegido)
    patch_sa = client.patch(
        f"/api/v1/auth/users/{superadmin_id}",
        json={"role": "aluno"},
        headers=admin_headers
    )
    assert patch_sa.status_code == 403

    del_sa = client.delete(
        f"/api/v1/auth/users/{superadmin_id}",
        headers=admin_headers
    )
    assert del_sa.status_code == 403


def test_calculate_course_expiration_hours_and_custom():
    base = datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)

    # 1. Testes de Presets de Horas
    assert calculate_course_expiration("1_hour", base_time=base) == base + timedelta(hours=1)
    assert calculate_course_expiration("2_hours", base_time=base) == base + timedelta(hours=2)
    assert calculate_course_expiration("4_hours", base_time=base) == base + timedelta(hours=4)
    assert calculate_course_expiration("6_hours", base_time=base) == base + timedelta(hours=6)
    assert calculate_course_expiration("12_hours", base_time=base) == base + timedelta(hours=12)

    # 2. Testes de Customizado (Dias e Horas combinados)
    assert calculate_course_expiration("custom:0d_3h", base_time=base) == base + timedelta(hours=3)
    assert calculate_course_expiration("custom:1d_12h", base_time=base) == base + timedelta(days=1, hours=12)
    assert calculate_course_expiration("custom:3d_0h", base_time=base) == base + timedelta(days=3)
    assert calculate_course_expiration("custom:0d_0h", base_time=base) == base + timedelta(hours=1)


def test_user_course_access_with_hours_and_custom_via_patch():
    headers = get_superadmin_headers()
    db = TestingSessionLocal()

    c1 = Course(title="Curso Horas", description="Liberado por algumas horas")
    c2 = Course(title="Curso Custom", description="Liberado dias + horas")
    db.add_all([c1, c2])
    db.commit()
    db.refresh(c1)
    db.refresh(c2)

    student = User(
        name="Aluno Acesso Horas",
        email="aluno_horas@teste.com",
        hashed_password=get_password_hash("Senha@123456"),
        role="aluno",
        is_active=True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    student_id = student.id
    c1_id = c1.id
    c2_id = c2.id
    db.close()

    # Atualiza acesso do aluno definindo horas para c1 e custom para c2
    patch_res = client.patch(
        f"/api/v1/auth/users/{student_id}",
        json={
            "role": "aluno",
            "course_ids": [c1_id, c2_id],
            "course_access": [
                {"course_id": c1_id, "access_duration": "6_hours"},
                {"course_id": c2_id, "access_duration": "custom:2d_6h"},
            ],
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert len(data["course_access"]) == 2

    access_map = {item["course_id"]: item for item in data["course_access"]}
    assert access_map[c1_id]["access_duration"] == "6_hours"
    assert access_map[c1_id]["expires_at"] is not None

    assert access_map[c2_id]["access_duration"] == "custom:2d_6h"
    assert access_map[c2_id]["expires_at"] is not None

def test_student_course_days_remaining_brasilia_timezone():
    headers = get_superadmin_headers()
    db = TestingSessionLocal()

    course = Course(title="Curso Brasilia Timezone", description="Teste de fuso")
    db.add(course)
    db.commit()
    db.refresh(course)
    cid = course.id

    student = User(
        name="Aluno Fuso Brasilia",
        email="fuso_brasilia@teste.com",
        hashed_password=get_password_hash("Senha@123456"),
        role="aluno",
        is_active=True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    sid = student.id

    from zoneinfo import ZoneInfo
    br_tz = ZoneInfo("America/Sao_Paulo")
    now_utc = datetime.now(timezone.utc)
    now_br = now_utc.astimezone(br_tz)

    tomorrow_br = now_br + timedelta(days=1)
    tomorrow_exp = datetime(tomorrow_br.year, tomorrow_br.month, tomorrow_br.day, 1, 36, tzinfo=br_tz)
    tomorrow_utc = tomorrow_exp.astimezone(timezone.utc).replace(tzinfo=None)

    uc = UserCourse(user_id=sid, course_id=cid, access_duration="custom:0d_5h", expires_at=tomorrow_utc)
    db.add(uc)
    db.commit()
    db.close()

    res = client.get("/api/v1/students", headers=headers)
    assert res.status_code == 200
    st_list = res.json()["items"]
    target_st = next((s for s in st_list if s["id"] == sid), None)
    assert target_st is not None
    course_item = next((c for c in target_st["courses"] if c["course_id"] == cid), None)
    assert course_item is not None
    assert course_item["days_remaining"] == 1
