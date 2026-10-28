"""
Endpoints dedicados a operações em lote e recursos específicos de aulas e módulos.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Module, Lesson
from app.schemas.course import BatchLessonThumbnailUpdate, BatchLessonOrderUpdate
from app.api.v1.endpoints.users import require_admin_or_superadmin

router = APIRouter(prefix="/courses", tags=["Cursos e Módulos"])


@router.patch(
    "/{course_id}/modules/{module_id}/lessons/batch-thumbnail",
    tags=["Cursos e Módulos"],
    summary="Atualizar Capa das Aulas em Lote",
    status_code=status.HTTP_200_OK
)
def batch_update_lesson_thumbnails(
    course_id: int,
    module_id: int,
    payload: BatchLessonThumbnailUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza a imagem de capa (thumbnail) de múltiplas aulas selecionadas pertencentes a um módulo.
    Permite ao gestor selecionar todas as aulas de um módulo específico e aplicar a nova capa de uma única vez.
    """
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado neste curso.")

    lessons = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.id.in_(payload.lesson_ids)
    ).all()

    if not lessons:
        raise HTTPException(status_code=404, detail="Nenhuma aula encontrada para os IDs informados neste módulo.")

    clean_url = payload.thumbnail_url.strip() if payload.thumbnail_url else None
    updated_ids = []
    for l in lessons:
        l.thumbnail_url = clean_url
        updated_ids.append(l.id)

    db.commit()
    logger.info(f"[BATCH THUMBNAIL] Capa atualizada para {len(updated_ids)} aula(s) do módulo #{module_id} pelo usuário #{current_user.id}")

    return {
        "message": f"Capa atualizada com sucesso para {len(updated_ids)} aula(s).",
        "updated_lesson_ids": updated_ids,
        "thumbnail_url": clean_url
    }


@router.patch(
    "/{course_id}/modules/{module_id}/lessons/batch-order",
    tags=["Cursos e Módulos"],
    summary="Atualizar Ordem das Aulas em Lote",
    status_code=status.HTTP_200_OK
)
def batch_update_lesson_order(
    course_id: int,
    module_id: int,
    payload: BatchLessonOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza a ordem de exibição (order_index) de múltiplas aulas pertencentes a um módulo.
    Permite ao gestor reordenar todas as aulas do módulo de uma única vez.
    """
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado neste curso.")

    item_map = {item.lesson_id: item.order_index for item in payload.items}
    lessons = db.query(Lesson).filter(
        Lesson.module_id == module_id,
        Lesson.id.in_(list(item_map.keys()))
    ).all()

    if not lessons:
        raise HTTPException(status_code=404, detail="Nenhuma aula encontrada para os IDs informados neste módulo.")

    updated_items = []
    for l in lessons:
        if l.id in item_map:
            l.order_index = item_map[l.id]
            updated_items.append({"lesson_id": l.id, "order_index": l.order_index})

    db.commit()
    logger.info(f"[BATCH ORDER] Ordem atualizada para {len(updated_items)} aula(s) do módulo #{module_id} pelo usuário #{current_user.id}")

    return {
        "message": f"Ordem atualizada com sucesso para {len(updated_items)} aula(s).",
        "updated_lessons": updated_items
    }
