from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class BackupManualRequest(BaseModel):
    custom_name: Optional[str] = None

class BackupRenameRequest(BaseModel):
    new_name: str

class BackupScheduleUpdate(BaseModel):
    is_active: bool
    frequency: str # '1h', '6h', '12h', '24h', '7d'
    destination_folder: str
    retention_max: int

class BackupScheduleResponse(BaseModel):
    id: int
    is_active: bool
    frequency: str
    destination_folder: str
    retention_max: int
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class BackupHistoryResponse(BaseModel):
    id: int
    filename: str
    s3_key: str
    file_size_bytes: int
    file_size_formatted: Optional[str] = None
    backup_type: str # 'manual', 'automatic', 'imported'
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BackupDashboardStats(BaseModel):
    last_backup_filename: Optional[str] = None
    last_backup_date: Optional[datetime] = None
    next_backup_date: Optional[datetime] = None
    frequency_label: str = "A cada 6 hora(s)"
    current_count: int = 0
    retention_max: int = 30
    total_bytes_used: int = 0
    total_size_formatted: str = "0 B utilizados"
    b2_connected: bool = False
    b2_status: str = "Não Configurado"
    b2_bucket: str = "—"
