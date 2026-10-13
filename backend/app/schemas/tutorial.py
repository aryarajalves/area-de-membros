from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class TutorialBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título da aula de tutorial")
    description: Optional[str] = Field(None, description="Descrição ou instruções da aula")
    video_url: str = Field(..., min_length=1, max_length=1024, description="URL do vídeo")
    video_key: Optional[str] = Field(None, max_length=512, description="Chave do arquivo no storage")
    thumbnail_url: Optional[str] = Field(None, max_length=1024, description="Thumbnail do tutorial")
    duration: Optional[str] = Field(None, max_length=50, description="Duração estimada (ex: 05:30)")
    order_index: Optional[int] = Field(0, description="Ordem de exibição na playlist")
    is_active: Optional[bool] = Field(True, description="Indica se o tutorial está ativo")


class TutorialCreate(TutorialBase):
    pass


class TutorialUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    video_url: Optional[str] = Field(None, min_length=1, max_length=1024)
    video_key: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class TutorialReorderItem(BaseModel):
    id: int
    order_index: int


class TutorialReorderRequest(BaseModel):
    items: List[TutorialReorderItem]


class TutorialResponse(TutorialBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
