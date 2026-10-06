import pytest
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.models.backup import BackupHistory, BackupSchedule
from tests.conftest import TestingSessionLocal

client = TestClient(app)
BR_TZ = ZoneInfo("America/Sao_Paulo")

def get_superadmin_token():
    login_res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return login_res.json()["access_token"]

def test_backup_dashboard_stats_and_schedule_timezone():
    token = get_superadmin_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = TestingSessionLocal()

    # 1. Configura um backup histórico e um agendamento com data no passado
    now_utc = datetime.now(timezone.utc)
    past_utc = now_utc - timedelta(days=2)

    schedule = db.query(BackupSchedule).first()
    if not schedule:
        schedule = BackupSchedule(
            is_active=True,
            frequency="6h",
            destination_folder="projetobase/backups/",
            retention_max=30,
            next_run_at=past_utc
        )
        db.add(schedule)
    else:
        schedule.is_active = True
        schedule.frequency = "6h"
        schedule.next_run_at = past_utc
    db.commit()

    # 2. Chama dashboard-stats
    res = client.get("/api/v1/backups/dashboard-stats", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Próximo backup deve ter sido recalculado para uma data no futuro relativo a now_utc
    assert data["next_backup_date"] is not None
    next_dt = datetime.fromisoformat(data["next_backup_date"])
    assert next_dt > now_utc
    # Garante que possui timezone info
    assert next_dt.tzinfo is not None

    # Se houver último backup, também deve ser timezone-aware
    if data["last_backup_date"]:
        last_dt = datetime.fromisoformat(data["last_backup_date"])
        assert last_dt.tzinfo is not None

    # 3. Testa consulta de schedule
    sched_res = client.get("/api/v1/backups/schedule", headers=headers)
    assert sched_res.status_code == 200
    sched_data = sched_res.json()
    if sched_data["next_run_at"]:
        s_next = datetime.fromisoformat(sched_data["next_run_at"])
        assert s_next.tzinfo is not None

    db.close()
