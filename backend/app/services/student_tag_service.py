from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.student_tag import StudentTag, StudentTagAssignment
from app.models.user import User
from app.schemas.student_tag import StudentTagCreate, StudentTagUpdate, StudentTagResponse, StudentTagAssignmentItem
from app.core.logger import logger


def list_tags(db: Session) -> List[StudentTagResponse]:
    """
    Retorna todas as etiquetas cadastradas com a quantidade de alunos vinculados.
    """
    tags = db.query(StudentTag).order_by(StudentTag.name.asc()).all()
    results: List[StudentTagResponse] = []

    # Contagem de alunos por etiqueta
    counts = (
        db.query(StudentTagAssignment.tag_id, func.count(StudentTagAssignment.student_id))
        .group_by(StudentTagAssignment.tag_id)
        .all()
    )
    counts_map = {tag_id: count for tag_id, count in counts}

    for tag in tags:
        results.append(
            StudentTagResponse(
                id=tag.id,
                name=tag.name,
                color=tag.color or "#3b82f6",
                description=tag.description,
                student_count=counts_map.get(tag.id, 0),
                created_at=tag.created_at,
            )
        )
    return results


def create_tag(db: Session, tag_in: StudentTagCreate) -> StudentTagResponse:
    """
    Cria uma nova etiqueta de aluno.
    """
    existing = db.query(StudentTag).filter(func.lower(StudentTag.name) == func.lower(tag_in.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma etiqueta com o nome '{tag_in.name}'.",
        )

    tag = StudentTag(
        name=tag_in.name.strip(),
        color=tag_in.color or "#3b82f6",
        description=tag_in.description.strip() if tag_in.description else None,
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    logger.info(f"Etiqueta criada com sucesso: ID {tag.id} - '{tag.name}'")

    return StudentTagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        student_count=0,
        created_at=tag.created_at,
    )


def update_tag(db: Session, tag_id: int, tag_in: StudentTagUpdate) -> StudentTagResponse:
    """
    Atualiza uma etiqueta existente.
    """
    tag = db.query(StudentTag).filter(StudentTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Etiqueta não encontrada.")

    if tag_in.name and tag_in.name.strip() != tag.name:
        existing = db.query(StudentTag).filter(
            func.lower(StudentTag.name) == func.lower(tag_in.name.strip()),
            StudentTag.id != tag_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe outra etiqueta com o nome '{tag_in.name}'.",
            )
        tag.name = tag_in.name.strip()

    if tag_in.color is not None:
        tag.color = tag_in.color
    if tag_in.description is not None:
        tag.description = tag_in.description.strip() if tag_in.description else None

    db.commit()
    db.refresh(tag)

    student_count = db.query(func.count(StudentTagAssignment.student_id)).filter(
        StudentTagAssignment.tag_id == tag_id
    ).scalar() or 0

    logger.info(f"Etiqueta atualizada: ID {tag.id} - '{tag.name}'")
    return StudentTagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        student_count=student_count,
        created_at=tag.created_at,
    )


def delete_tag(db: Session, tag_id: int) -> dict:
    """
    Exclui uma etiqueta e seus vínculos associados.
    """
    tag = db.query(StudentTag).filter(StudentTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Etiqueta não encontrada.")

    tag_name = tag.name
    db.delete(tag)
    db.commit()
    logger.info(f"Etiqueta excluída: ID {tag_id} - '{tag_name}'")
    return {"message": f"Etiqueta '{tag_name}' excluída com sucesso."}


def get_student_tags(db: Session, student_id: int) -> List[StudentTagAssignmentItem]:
    """
    Retorna as etiquetas vinculadas a um aluno específico.
    """
    assignments = (
        db.query(StudentTagAssignment)
        .join(StudentTag, StudentTagAssignment.tag_id == StudentTag.id)
        .filter(StudentTagAssignment.student_id == student_id)
        .order_by(StudentTag.name.asc())
        .all()
    )
    return [
        StudentTagAssignmentItem(
            id=a.tag.id,
            name=a.tag.name,
            color=a.tag.color or "#3b82f6",
            description=a.tag.description,
        )
        for a in assignments
    ]


def sync_student_tags(db: Session, student_id: int, tag_ids: List[int]) -> List[StudentTagAssignmentItem]:
    """
    Sincroniza as etiquetas de um aluno (define o conjunto exato de tags).
    """
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado.")

    # Remover vínculos atuais
    db.query(StudentTagAssignment).filter(StudentTagAssignment.student_id == student_id).delete()

    # Adicionar novos vínculos
    valid_tags = db.query(StudentTag).filter(StudentTag.id.in_(tag_ids)).all() if tag_ids else []
    for tag in valid_tags:
        db.add(StudentTagAssignment(student_id=student_id, tag_id=tag.id))

    db.commit()
    logger.info(f"Etiquetas do aluno {student.name} (ID {student_id}) sincronizadas: {[t.name for t in valid_tags]}")

    return [
        StudentTagAssignmentItem(
            id=t.id,
            name=t.name,
            color=t.color or "#3b82f6",
            description=t.description,
        )
        for t in valid_tags
    ]
