import os
from typing import List, Optional
from fastapi import APIRouter, Depends, status, BackgroundTasks, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.schemas.funnel import (
    FunnelCreate,
    FunnelUpdate,
    FunnelSummary,
    FunnelDetail,
    FunnelTriggerRequest,
    FunnelTriggerResponse,
)
from app.services.funnel_service import (
    list_funnels,
    get_funnel_detail,
    create_funnel,
    update_funnel,
    delete_funnel,
    duplicate_funnel,
    execute_funnel_flow,
)

router = APIRouter(prefix="/funnels", tags=["Funis de Mensagens"])


@router.get("", response_model=List[FunnelSummary], summary="Listar Funis Cadastrados")
def list_all_funnels(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Retorna o catálogo de funis com contagem de nós e execuções."""
    return list_funnels(db)


@router.post("", response_model=FunnelDetail, status_code=status.HTTP_201_CREATED, summary="Criar Novo Funil")
def create_new_funnel(
    data: FunnelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Cria um novo funil com fluxo padrão inicial."""
    return create_funnel(db, current_user, data)


@router.get("/{funnel_id}", response_model=FunnelDetail, summary="Obter Detalhes do Funil")
def get_funnel_by_id(
    funnel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna os dados completos do funil e seu canvas de nós."""
    return get_funnel_detail(db, funnel_id)


@router.put("/{funnel_id}", response_model=FunnelDetail, summary="Salvar Fluxo do Funil")
def update_funnel_by_id(
    funnel_id: int,
    data: FunnelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Salva as alterações de nós, posições e conexões do funil."""
    return update_funnel(db, funnel_id, data)


@router.delete("/{funnel_id}", status_code=status.HTTP_200_OK, summary="Excluir Funil")
def delete_funnel_by_id(
    funnel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Exclui um funil existente."""
    delete_funnel(db, funnel_id)
    return {"message": "Funil excluído com sucesso."}


@router.post("/{funnel_id}/duplicate", response_model=FunnelDetail, summary="Duplicar Funil")
def duplicate_funnel_by_id(
    funnel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Clona a estrutura de nós de um funil existente."""
    return duplicate_funnel(db, funnel_id, current_user)


@router.post("/{funnel_id}/trigger", response_model=FunnelTriggerResponse, summary="Disparar Funil para Aluno")
async def trigger_funnel(
    funnel_id: int,
    body: FunnelTriggerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Aciona a execução do funil para um aluno.
    Pode ser chamado:
    1) Pelo próprio aluno ao clicar no botão de CTA na DM (student_id = current_user.id)
    2) Pelo administrador disparando manualmente para um aluno específico.
    """
    detail = get_funnel_detail(db, funnel_id)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funil não encontrado.")

    # Se for aluno chamando, o destinatário é ele mesmo
    if current_user.role == "aluno":
        target_student_id = current_user.id
        # O remetente da mensagem é o criador do funil ou superadmin (id=1)
        sender_id = detail.id if False else 1
    else:
        # Se for admin, usa o student_id fornecido no corpo ou o próprio admin
        target_student_id = body.student_id or current_user.id
        sender_id = current_user.id

    # Executa o fluxo assincronamente em background
    background_tasks.add_task(
        execute_funnel_flow,
        funnel_id=funnel_id,
        student_id=target_student_id,
        sender_id=sender_id,
        button_payload=body.button_payload,
    )

    return FunnelTriggerResponse(
        success=True,
        message="Disparo do funil iniciado com sucesso!",
    )


@router.post("/upload-media", summary="Upload de Mídia para Funis")
async def upload_funnel_media(
    file: UploadFile = File(...),
    media_type: Optional[str] = Form(None),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Realiza upload de imagem, vídeo, áudio ou documento para nó de funil.
    Salva no Backblaze B2 com fallback seguro para armazenamento local.
    """
    from app.services.funnel_media_service import process_funnel_media_upload
    return await process_funnel_media_upload(file=file, media_type_hint=media_type)


@router.get("/media/{filename}", summary="Servir Mídia Local de Funil")
def get_funnel_local_media(filename: str):
    """Serve arquivos de mídia de funil salvos localmente."""
    from app.services.funnel_media_service import FUNNEL_MEDIA_DIR
    safe_name = os.path.basename(filename)
    path = os.path.join(FUNNEL_MEDIA_DIR, safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo de mídia não encontrado.")
    return FileResponse(path)

