from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.platform_link import PlatformLink
from app.schemas.platform_link import (
    PlatformLinkCreate,
    PlatformLinkUpdate,
    PlatformLinkResponse,
)
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()


def require_admin_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return current_user


@router.get("", response_model=List[PlatformLinkResponse])
def list_platform_links(
    include_inactive: bool = Query(False, description="Incluir links desativados (apenas admin)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a lista de links da plataforma.
    Alunos visualizam apenas links ativos.
    Administradores podem solicitar todos os links para gestão.
    """
    try:
        query = db.query(PlatformLink)

        # Se não for admin ou se não pediu inativos, filtra somente ativos
        if current_user.role not in ["superadmin", "admin"] or not include_inactive:
            query = query.filter(PlatformLink.is_active == True)

        links = query.order_by(asc(PlatformLink.order_index), asc(PlatformLink.id)).all()
        return links
    except Exception as exc:
        logger.error(f"[PlatformLinks] Erro ao listar links: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar links da plataforma."
        )


@router.post("", response_model=PlatformLinkResponse, status_code=status.HTTP_201_CREATED)
def create_platform_link(
    data: PlatformLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Cria um novo link para exibição na barra lateral (Apenas Admin/SuperAdmin).
    """
    try:
        new_link = PlatformLink(
            title=data.title.strip(),
            url=data.url.strip(),
            icon=(data.icon or "link").strip().lower(),
            order_index=data.order_index or 0,
            is_active=data.is_active if data.is_active is not None else True,
        )
        db.add(new_link)
        db.commit()
        db.refresh(new_link)
        logger.info(f"[PlatformLinks] Link '{new_link.title}' criado por #{current_user.id} ({current_user.name}).")
        return new_link
    except Exception as exc:
        db.rollback()
        logger.error(f"[PlatformLinks] Erro ao criar link: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao cadastrar link da plataforma."
        )


@router.put("/{link_id}", response_model=PlatformLinkResponse)
def update_platform_link(
    link_id: int,
    data: PlatformLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza um link existente (Apenas Admin/SuperAdmin).
    """
    link = db.query(PlatformLink).filter(PlatformLink.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link não encontrado."
        )

    try:
        if data.title is not None:
            link.title = data.title.strip()
        if data.url is not None:
            link.url = data.url.strip()
        if data.icon is not None:
            link.icon = data.icon.strip().lower()
        if data.order_index is not None:
            link.order_index = data.order_index
        if data.is_active is not None:
            link.is_active = data.is_active

        db.commit()
        db.refresh(link)
        logger.info(f"[PlatformLinks] Link #{link.id} atualizado por #{current_user.id}.")
        return link
    except Exception as exc:
        db.rollback()
        logger.error(f"[PlatformLinks] Erro ao atualizar link #{link_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar link da plataforma."
        )


@router.delete("/{link_id}", status_code=status.HTTP_200_OK)
def delete_platform_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Exclui um link da plataforma (Apenas Admin/SuperAdmin).
    """
    link = db.query(PlatformLink).filter(PlatformLink.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link não encontrado."
        )

    try:
        title = link.title
        db.delete(link)
        db.commit()
        logger.info(f"[PlatformLinks] Link #{link_id} ('{title}') excluído por #{current_user.id}.")
        return {"detail": f"Link '{title}' excluído com sucesso."}
    except Exception as exc:
        db.rollback()
        logger.error(f"[PlatformLinks] Erro ao excluir link #{link_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao excluir link da plataforma."
        )
