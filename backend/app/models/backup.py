from sqlalchemy import Column, Integer, String, Boolean, DateTime, BigInteger
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class BackupSchedule(Base):
    __tablename__ = "backup_schedules"

    id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    frequency = Column(String, default="6h", nullable=False) # '1h', '6h', '12h', '24h', '7d'
    destination_folder = Column(String, default="projetobase/backups/", nullable=False)
    retention_max = Column(Integer, default=30, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class BackupHistory(Base):
    __tablename__ = "backup_histories"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True, nullable=False) # ex: backup_2026_09_24_15_00_00.dump.gz
    s3_key = Column(String, nullable=False) # chave no bucket
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    backup_type = Column(String, default="manual", nullable=False) # 'manual', 'automatic', 'imported'
    status = Column(String, default="success", nullable=False) # 'success', 'failed'
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
