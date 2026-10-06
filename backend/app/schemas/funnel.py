from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class FunnelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: str = "chat_button"
    trigger_keywords: Optional[str] = None
    flow_data: str = "{}"
    is_active: bool = True


class FunnelCreate(FunnelBase):
    pass


class FunnelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_keywords: Optional[str] = None
    flow_data: Optional[str] = None
    is_active: Optional[bool] = None


class FunnelSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    trigger_type: str
    trigger_keywords: Optional[str] = None
    is_active: bool
    nodes_count: int = 0
    executions_count: int = 0
    created_at: datetime
    updated_at: datetime
    created_by_name: Optional[str] = None

    model_config = {"from_attributes": True}


class FunnelDetail(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    trigger_type: str
    trigger_keywords: Optional[str] = None
    flow_data: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by_name: Optional[str] = None

    model_config = {"from_attributes": True}


class FunnelTriggerRequest(BaseModel):
    student_id: Optional[int] = None
    button_payload: Optional[str] = None


class FunnelTriggerResponse(BaseModel):
    success: bool
    message: str
    execution_id: Optional[int] = None
    messages_dispatched: int = 0
