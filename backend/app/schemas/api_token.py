from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ApiTokenCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Nome identificador da chave de API")
    expiration_days: Optional[int] = Field(None, ge=1, le=3650, description="Dias para expirar (opcional, None = sem expiração)")

class ApiTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    masked_token: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

class ApiTokenCreatedResponse(ApiTokenResponse):
    raw_token: str = Field(..., description="Token completo para exibição única ao usuário")
