from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class FunnelFolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = "#6366f1"
    order_index: int = 0


class FunnelFolderCreate(FunnelFolderBase):
    pass


class FunnelFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = None
    order_index: Optional[int] = None


class FunnelFolderItem(BaseModel):
    id: int
    name: str
    color: Optional[str] = "#6366f1"
    order_index: int = 0
    funnels_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FunnelMoveFolderRequest(BaseModel):
    folder_id: Optional[int] = None


class FunnelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: str = "chat_button"
    trigger_keywords: Optional[str] = None
    flow_data: str = "{}"
    is_active: bool = True
    folder_id: Optional[int] = None


class FunnelCreate(FunnelBase):
    pass


class FunnelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_keywords: Optional[str] = None
    flow_data: Optional[str] = None
    is_active: Optional[bool] = None
    folder_id: Optional[int] = None


class FunnelSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    trigger_type: str
    trigger_keywords: Optional[str] = None
    is_active: bool
    folder_id: Optional[int] = None
    folder_name: Optional[str] = None
    folder_color: Optional[str] = None
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
    folder_id: Optional[int] = None
    folder_name: Optional[str] = None
    folder_color: Optional[str] = None
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


class FunnelSenderOption(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class FunnelExecutionItem(BaseModel):
    id: int
    funnel_id: int
    funnel_name: str
    user_id: int
    student_name: str
    student_email: Optional[str] = None
    student_avatar: Optional[str] = None
    triggered_by: str
    current_node_id: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    logs: Optional[str] = None
    visited_nodes: List[str] = []

    model_config = {"from_attributes": True}


class FunnelExecutionsResponse(BaseModel):
    funnel_id: int
    funnel_name: str
    flow_nodes: List[Any] = []
    flow_edges: List[Any] = []
    total_executions: int = 0
    running_count: int = 0
    completed_count: int = 0
    executions: List[FunnelExecutionItem] = []


class ContactActiveFunnelItem(BaseModel):
    execution_id: int
    funnel_id: int
    funnel_name: str
    triggered_by: str
    status: str
    current_node_id: Optional[str] = None
    current_node_type: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    progress_percentage: int = 0
    visited_nodes_count: int = 0
    total_nodes_count: int = 0

    model_config = {"from_attributes": True}
