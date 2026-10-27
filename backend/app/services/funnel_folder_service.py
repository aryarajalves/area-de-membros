from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.core.logger import logger
from app.models.funnel import Funnel, FunnelFolder
from app.schemas.funnel import (
    FunnelFolderCreate,
    FunnelFolderUpdate,
    FunnelFolderItem,
    FunnelDetail,
)
from app.services.funnel_service import get_funnel_detail


def list_funnel_folders(db: Session) -> List[FunnelFolderItem]:
    """Lista todas as pastas organizadoras de funis com a contagem de funis contidos."""
    folders = db.query(FunnelFolder).order_by(FunnelFolder.order_index.asc(), FunnelFolder.name.asc()).all()
    items = []
    for folder in folders:
        count = db.query(func.count(Funnel.id)).filter(Funnel.folder_id == folder.id).scalar() or 0
        items.append(
            FunnelFolderItem(
                id=folder.id,
                name=folder.name,
                color=folder.color or "#6366f1",
                order_index=folder.order_index,
                funnels_count=count,
                created_at=folder.created_at,
                updated_at=folder.updated_at,
            )
        )
    return items


def create_funnel_folder(db: Session, data: FunnelFolderCreate) -> FunnelFolderItem:
    """Cria uma nova pasta de funis."""
    folder_name = data.name.strip()
    if not folder_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome da pasta é obrigatório.")

    # Verifica se já existe pasta com esse nome
    existing = db.query(FunnelFolder).filter(func.lower(FunnelFolder.name) == folder_name.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe uma pasta com este nome.")

    folder = FunnelFolder(
        name=folder_name,
        color=data.color or "#6366f1",
        order_index=data.order_index or 0,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    logger.info(f"[FUNNEL_FOLDER] Pasta criada com sucesso: {folder.name} (ID: {folder.id})")
    return FunnelFolderItem(
        id=folder.id,
        name=folder.name,
        color=folder.color or "#6366f1",
        order_index=folder.order_index,
        funnels_count=0,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
    )


def update_funnel_folder(db: Session, folder_id: int, data: FunnelFolderUpdate) -> FunnelFolderItem:
    """Atualiza o nome ou configurações de uma pasta."""
    folder = db.query(FunnelFolder).filter(FunnelFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta não encontrada.")

    if data.name is not None:
        new_name = data.name.strip()
        if not new_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome da pasta não pode ser vazio.")
        # Verifica duplicidade
        duplicate = db.query(FunnelFolder).filter(
            func.lower(FunnelFolder.name) == new_name.lower(),
            FunnelFolder.id != folder_id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe outra pasta com este nome.")
        folder.name = new_name

    if data.color is not None:
        folder.color = data.color.strip() if data.color else "#6366f1"
    if data.order_index is not None:
        folder.order_index = data.order_index

    folder.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(folder)

    count = db.query(func.count(Funnel.id)).filter(Funnel.folder_id == folder.id).scalar() or 0
    return FunnelFolderItem(
        id=folder.id,
        name=folder.name,
        color=folder.color or "#6366f1",
        order_index=folder.order_index,
        funnels_count=count,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
    )


def delete_funnel_folder(db: Session, folder_id: int) -> bool:
    """
    Exclui uma pasta de funis com segurança.
    Conforme regra de negócio, os funis vinculados NÃO são excluídos:
    são automaticamente desvinculados para ficarem 'Sem Pasta'.
    """
    folder = db.query(FunnelFolder).filter(FunnelFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta não encontrada.")

    # Desvincula funis da pasta antes de remover
    db.query(Funnel).filter(Funnel.folder_id == folder_id).update({Funnel.folder_id: None})
    db.delete(folder)
    db.commit()
    logger.info(f"[FUNNEL_FOLDER] Pasta excluída e funis preservados em 'Sem Pasta' (ID: {folder_id})")
    return True


def move_funnel_to_folder(db: Session, funnel_id: int, folder_id: Optional[int]) -> FunnelDetail:
    """Move um funil para uma pasta específica ou remove da pasta (None)."""
    funnel = db.query(Funnel).filter(Funnel.id == funnel_id).first()
    if not funnel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")

    if folder_id is not None:
        folder = db.query(FunnelFolder).filter(FunnelFolder.id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta destino não encontrada.")
        funnel.folder_id = folder.id
    else:
        funnel.folder_id = None

    funnel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(funnel)
    return get_funnel_detail(db, funnel.id)
