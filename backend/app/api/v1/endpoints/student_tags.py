from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.v1.endpoints.users import require_admin_or_superadmin
from app.schemas.student_tag import (
    StudentTagCreate,
    StudentTagUpdate,
    StudentTagResponse,
    StudentTagAssignmentItem,
    StudentTagBatchAssignRequest,
)
from app.services.student_tag_service import (
    list_tags,
    create_tag,
    update_tag,
    delete_tag,
    get_student_tags,
    sync_student_tags,
)

router = APIRouter(prefix="/students/tags", tags=["Etiquetas de Alunos"])


@router.get("", response_model=List[StudentTagResponse], summary="Listar Todas as Etiquetas")
def get_all_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna a lista de todas as etiquetas com a contagem de alunos associados.
    """
    return list_tags(db)


@router.post("", response_model=StudentTagResponse, status_code=status.HTTP_201_CREATED, summary="Criar Etiqueta")
def create_new_tag(
    tag_in: StudentTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Cria uma nova etiqueta para segmentação de alunos.
    """
    return create_tag(db, tag_in)


@router.put("/{tag_id}", response_model=StudentTagResponse, summary="Atualizar Etiqueta")
def update_existing_tag(
    tag_id: int,
    tag_in: StudentTagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza nome, cor ou descrição de uma etiqueta.
    """
    return update_tag(db, tag_id, tag_in)


@router.delete("/{tag_id}", summary="Excluir Etiqueta")
def delete_existing_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Exclui uma etiqueta e desvincula dos alunos associados.
    """
    return delete_tag(db, tag_id)


@router.get("/student/{student_id}", response_model=List[StudentTagAssignmentItem], summary="Listar Etiquetas do Aluno")
def get_tags_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna as etiquetas vinculadas a um aluno específico.
    """
    return get_student_tags(db, student_id)


@router.put("/student/{student_id}", response_model=List[StudentTagAssignmentItem], summary="Sincronizar Etiquetas do Aluno")
def sync_tags_for_student(
    student_id: int,
    body: StudentTagBatchAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Define e sincroniza o conjunto de etiquetas atribuídas ao aluno.
    """
    return sync_student_tags(db, student_id, body.tag_ids)
