from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class StudentTagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Nome da etiqueta")
    color: str = Field(default="#3b82f6", max_length=20, description="Cor hexadecimal da etiqueta")
    description: Optional[str] = Field(default=None, max_length=255, description="Descrição opcional")


class StudentTagCreate(StudentTagBase):
    pass


class StudentTagUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=255)


class StudentTagResponse(StudentTagBase):
    id: int
    student_count: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudentTagAssignmentItem(BaseModel):
    id: int
    name: str
    color: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentTagBatchAssignRequest(BaseModel):
    tag_ids: List[int] = Field(default=[], description="Lista de IDs de etiquetas para vincular ao aluno")
