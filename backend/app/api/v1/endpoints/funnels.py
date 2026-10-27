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
    FunnelSenderOption,
    FunnelExecutionsResponse,
    ContactActiveFunnelItem,
    FunnelFolderCreate,
    FunnelFolderUpdate,
    FunnelFolderItem,
    FunnelMoveFolderRequest,
)
from app.services.funnel_folder_service import (
    list_funnel_folders,
    create_funnel_folder,
    update_funnel_folder,
    delete_funnel_folder,
    move_funnel_to_folder,
)
from app.services.funnel_service import (
    list_funnels,
    get_funnel_detail,
    create_funnel,
    update_funnel,
    delete_funnel,
    duplicate_funnel,
    execute_funnel_flow,
    check_and_dispatch_delayed_student_funnels,
    dispatch_student_inactivity_funnels,
    get_funnel_executions,
    get_contact_active_funnels,
)

router = APIRouter(prefix="/funnels", tags=["Funis de Mensagens"])


@router.get("/senders", response_model=List[FunnelSenderOption], summary="Listar Remetentes Autorizados para Funis")
def list_funnel_senders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Retorna os administradores e superadmins autorizados a disparar mensagens no funil."""
    users = db.query(User).filter(
        User.role.in_(["superadmin", "admin"]),
        User.is_active == True,
    ).order_by(User.role.desc(), User.name.asc()).all()
    return [
        FunnelSenderOption(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            avatar_url=getattr(u, "avatar_url", None),
        )
        for u in users
    ]


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


@router.get("/folders", response_model=List[FunnelFolderItem], summary="Listar Pastas de Funis")
def get_funnel_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Lista as pastas organizadoras de funis com contagem de funis contidos."""
    return list_funnel_folders(db)


@router.post("/folders", response_model=FunnelFolderItem, status_code=status.HTTP_201_CREATED, summary="Criar Pasta de Funis")
def create_new_folder(
    data: FunnelFolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Cria uma nova pasta organizadora de funis."""
    return create_funnel_folder(db, data)


@router.put("/folders/{folder_id}", response_model=FunnelFolderItem, summary="Atualizar Pasta de Funis")
def update_existing_folder(
    folder_id: int,
    data: FunnelFolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Renomeia ou ajusta as configurações de uma pasta."""
    return update_funnel_folder(db, folder_id, data)


@router.delete("/folders/{folder_id}", status_code=status.HTTP_200_OK, summary="Excluir Pasta de Funis")
def delete_existing_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Exclui uma pasta de funis. Os funis são preservados e movidos para 'Sem Pasta'."""
    delete_funnel_folder(db, folder_id)
    return {"message": "Pasta excluída com sucesso. Os funis contidos foram movidos para Sem Pasta."}


@router.patch("/{funnel_id}/folder", response_model=FunnelDetail, summary="Mover Funil para Pasta")
def move_funnel_folder(
    funnel_id: int,
    data: FunnelMoveFolderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Move um funil para uma pasta ou remove-o de qualquer pasta (null)."""
    return move_funnel_to_folder(db, funnel_id, data.folder_id)


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


@router.post("/check-triggers", summary="Verificar e Disparar Gatilhos Pendentes")
def check_funnel_triggers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Verifica alunos cadastrados e dispara funis que contenham gatilhos por tempo
    (ex: X dias após a criação do aluno).
    """
    dispatched = check_and_dispatch_delayed_student_funnels(db)
    inactivity_dispatched = dispatch_student_inactivity_funnels(db)
    total_dispatched = dispatched + inactivity_dispatched
    return {
        "success": True,
        "message": f"Verificação concluída. {total_dispatched} funil(is) acionado(s).",
        "dispatched_count": total_dispatched,
    }


@router.get("/{funnel_id}/executions", response_model=FunnelExecutionsResponse, summary="Listar Histórico de Execuções do Funil")
def get_funnel_executions_endpoint(
    funnel_id: int,
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna o histórico de todas as vezes que o funil foi disparado, com nós visitados,
    contatos, status e estrutura visual dos nós.
    """
    return get_funnel_executions(db, funnel_id, student_id=student_id, status_filter=status)


@router.get("/contacts/{student_id}/active-funnels", response_model=List[ContactActiveFunnelItem], summary="Listar Funis em Andamento do Contato")
def get_contact_active_funnels_endpoint(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna os funis ativos e histórico recente de execuções para um contato específico.
    """
    return get_contact_active_funnels(db, student_id)


