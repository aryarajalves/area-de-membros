"""
Endpoints de Gestão de Perfil do Usuário e Foto/Logo (Avatar).
"""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate
from app.api.v1.endpoints.users import get_current_user
from app.services.storage import upload_media_file

router = APIRouter(prefix="/auth", tags=["Perfil do Usuário"])


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Atualizar Perfil do Usuário Autenticado",
    description="Permite que o usuário autenticado atualize seus dados cadastrais (nome, email, telefone, senha e foto de perfil). O Super Admin não pode alterar nome, email ou senha por esta tela, apenas a foto de perfil."
)
def update_my_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_superadmin = current_user.role == "superadmin"

    # Regra: Super Admin NÃO pode alterar nome, email ou senha por esta tela
    if is_superadmin:
        wants_name_change = profile_data.name is not None and profile_data.name.strip() != current_user.name
        wants_email_change = profile_data.email is not None and str(profile_data.email).strip().lower() != current_user.email.lower()
        wants_password_change = bool(profile_data.password and profile_data.password.strip())

        if wants_name_change or wants_email_change or wants_password_change:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O Super Admin não pode alterar nome, email ou senha por esta tela, apenas a foto de perfil."
            )

    # 1. Atualizar nome (se não for superadmin)
    if profile_data.name is not None and not is_superadmin:
        clean_name = profile_data.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="O nome não pode ficar em branco.")
        current_user.name = clean_name

    # 2. Atualizar email (se não for superadmin)
    if profile_data.email is not None and not is_superadmin:
        clean_email = str(profile_data.email).strip().lower()
        if clean_email != current_user.email.lower():
            existing = db.query(User).filter(User.email == clean_email, User.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Este e-mail já está sendo utilizado por outro usuário.")
            current_user.email = clean_email

    # 3. Atualizar telefone/WhatsApp
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip() if profile_data.phone else None

    # 4. Atualizar avatar
    if profile_data.avatar_url is not None:
        clean_avatar = profile_data.avatar_url.strip() if profile_data.avatar_url else None
        current_user.avatar_url = clean_avatar

    # 5. Atualizar senha (se não for superadmin)
    if profile_data.password and not is_superadmin:
        clean_pw = profile_data.password.strip()
        if clean_pw:
            current_user.hashed_password = get_password_hash(clean_pw)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/upload-avatar",
    summary="Upload de Foto/Logo de Perfil",
    description="Permite que o usuário autenticado faça upload da sua foto de perfil ou logo (JPG, PNG, WEBP até 5MB)."
)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de imagem inválido. Use apenas JPG, PNG ou WEBP."
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A foto excede o limite máximo permitido de 5 MB."
        )

    unique_name = f"avatar_{uuid.uuid4().hex[:12]}{ext}"
    content_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    content_type = content_type_map.get(ext, "image/jpeg")

    # 1. Tentar salvar no Backblaze B2
    b2_url = upload_media_file(
        file_bytes=content,
        filename=unique_name,
        content_type=content_type,
        folder="AreaDeMembros/avatars/"
    )
    if b2_url:
        current_user.avatar_url = b2_url
        db.commit()
        db.refresh(current_user)
        return {"avatar_url": b2_url, "user": UserResponse.model_validate(current_user)}

    # 2. Fallback local se Backblaze B2 não estiver configurado
    base_upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        "uploads",
        "avatars"
    )
    os.makedirs(base_upload_dir, exist_ok=True)
    target_path = os.path.join(base_upload_dir, unique_name)
    with open(target_path, "wb") as f:
        f.write(content)

    local_url = f"/api/v1/auth/avatars/{unique_name}"
    current_user.avatar_url = local_url
    db.commit()
    db.refresh(current_user)
    return {"avatar_url": local_url, "user": UserResponse.model_validate(current_user)}


@router.get("/avatars/{filename}", include_in_schema=False)
def get_avatar_file(filename: str):
    base_upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        "uploads",
        "avatars"
    )
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(base_upload_dir, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Avatar não encontrado")
    return FileResponse(file_path)
