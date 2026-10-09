"""
Endpoints de Integração com o AgentFlow (Bases de Conhecimento RAG).
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.models.user import User
from app.models.course import Course, Lesson
from app.services.agentflow_service import agentflow_service

router = APIRouter(prefix="/agentflow", tags=["AgentFlow - Base de Conhecimento"])


class KnowledgeBaseCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class CourseLinkKbRequest(BaseModel):
    agentflow_kb_id: Optional[int] = None
    agentflow_kb_name: Optional[str] = None


class LessonSyncKbRequest(BaseModel):
    kb_id: Optional[int] = None


@router.get("/status")
def get_agentflow_status(current_user: User = Depends(get_current_user)):
    """Retorna o status da configuração do AgentFlow."""
    is_conf = agentflow_service.is_configured()
    cfg = agentflow_service._get_agentflow_env() if hasattr(agentflow_service, "_get_agentflow_env") else {}
    return {
        "configured": is_conf,
        "api_url": cfg.get("api_url", "https://backendagente.aryaraj.shop") if is_conf else ""
    }


@router.get("/knowledge-bases")
async def list_knowledge_bases(current_user: User = Depends(require_admin_or_superadmin)):
    """Lista as bases de conhecimento disponíveis no AgentFlow."""
    return await agentflow_service.list_knowledge_bases()


@router.post("/knowledge-bases")
async def create_knowledge_base(
    data: KnowledgeBaseCreateRequest,
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Cria uma nova base de conhecimento no AgentFlow."""
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="O nome da base de conhecimento é obrigatório.")
    return await agentflow_service.create_knowledge_base(data.name, data.description)


@router.post("/courses/{course_id}/link")
def link_course_to_knowledge_base(
    course_id: int,
    data: CourseLinkKbRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Vincula uma Base de Conhecimento do AgentFlow a um curso."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    course.agentflow_kb_id = data.agentflow_kb_id if (data.agentflow_kb_id and data.agentflow_kb_id > 0) else None
    course.agentflow_kb_name = data.agentflow_kb_name if course.agentflow_kb_id else None
    db.commit()
    db.refresh(course)
    return {
        "course_id": course.id,
        "agentflow_kb_id": course.agentflow_kb_id,
        "agentflow_kb_name": course.agentflow_kb_name,
        "message": "Base de conhecimento vinculada ao curso com sucesso." if course.agentflow_kb_id else "Vínculo removido."
    }


@router.post("/lessons/{lesson_id}/sync")
async def sync_lesson_to_agentflow(
    lesson_id: int,
    data: Optional[LessonSyncKbRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Sincroniza manualmente a transcrição, P&R e resumos da aula no AgentFlow."""
    kb_id = data.kb_id if data else None
    return await agentflow_service.sync_lesson_to_knowledge_base(db, lesson_id, kb_id=kb_id)
