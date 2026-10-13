import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course
from app.schemas.whitelabel import WhiteLabelConfig, WhiteLabelUpdate
from app.api.v1.endpoints.users import get_current_user
from app.services.storage import upload_media_file, delete_media_file

router = APIRouter()

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)
THUMBNAILS_DIR = os.path.join(BASE_UPLOAD_DIR, "thumbnails")
PLATFORM_THEME_FILE = os.path.join(BASE_UPLOAD_DIR, "platform_theme.json")

os.makedirs(THUMBNAILS_DIR, exist_ok=True)


def require_admin_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return current_user


def get_stored_whitelabel_data() -> dict:
    default_data = {
        "platform_name": "Área de Membros",
        "login_banner_url": None,
        "bg_color": "#090d16"
    }
    if os.path.exists(PLATFORM_THEME_FILE):
        try:
            with open(PLATFORM_THEME_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {
                    "platform_name": data.get("platform_name") or default_data["platform_name"],
                    "login_banner_url": data.get("login_banner_url") or None,
                    "bg_color": data.get("bg_color") or default_data["bg_color"],
                }
        except Exception as e:
            logger.error(f"[WhiteLabel] Erro ao ler {PLATFORM_THEME_FILE}: {e}")
    return default_data


def save_stored_whitelabel_data(data: dict):
    try:
        current = get_stored_whitelabel_data()
        current.update(data)
        with open(PLATFORM_THEME_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"[WhiteLabel] Erro ao salvar {PLATFORM_THEME_FILE}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao persistir configurações WhiteLabel."
        )


@router.get("", response_model=WhiteLabelConfig)
def get_whitelabel_settings():
    """
    Retorna as configurações WhiteLabel globais da plataforma (Nome, Banner de Login, Cor).
    Endpoint público para carregamento nas telas de Login, Registro e Topbar.
    """
    return get_stored_whitelabel_data()


@router.patch("", response_model=WhiteLabelConfig)
def update_whitelabel_settings(
    settings_in: WhiteLabelUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza as configurações WhiteLabel (Nome da Plataforma, Cor e/ou Banner de Login).
    Restrito a administradores e superadmins.
    """
    current = get_stored_whitelabel_data()

    if settings_in.platform_name is not None:
        clean_name = settings_in.platform_name.strip()
        current["platform_name"] = clean_name if clean_name else "Área de Membros"

    if settings_in.login_banner_url is not None:
        current["login_banner_url"] = settings_in.login_banner_url.strip() if settings_in.login_banner_url.strip() else None

    if settings_in.bg_color is not None:
        clean_color = settings_in.bg_color.strip()
        current["bg_color"] = clean_color if clean_color else "#090d16"
        # Sincroniza cor de fundo dos cursos no banco
        try:
            db.query(Course).update({Course.bg_color: current["bg_color"]}, synchronize_session=False)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error(f"[WhiteLabel] Erro ao sincronizar cor de fundo nos cursos: {exc}")

    save_stored_whitelabel_data(current)
    logger.info(f"[WhiteLabel] Configurações atualizadas por {admin.email}: {current}")
    return current


@router.post("/login-banner", response_model=WhiteLabelConfig)
async def upload_login_banner(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Faz upload de uma nova imagem para a tela de login (JPG, PNG, WEBP).
    Armazena no Backblaze B2 com fallback local.
    """
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".svg"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de imagem não suportado. Utilize: {', '.join(allowed_extensions)}"
        )

    try:
        content = await file.read()
        unique_filename = f"login_banner_{uuid.uuid4().hex[:12]}{file_ext}"

        # Tenta envio no B2
        b2_url = upload_media_file(
            file_bytes=content,
            filename=unique_filename,
            content_type=file.content_type or "image/jpeg",
            folder="AreaDeMembros/banners/"
        )

        if b2_url:
            banner_url = b2_url
        else:
            # Fallback local
            local_path = os.path.join(THUMBNAILS_DIR, unique_filename)
            with open(local_path, "wb") as f:
                f.write(content)
            banner_url = f"/api/v1/courses/thumbnails/{unique_filename}"

        current = get_stored_whitelabel_data()
        old_url = current.get("login_banner_url")
        if old_url:
            delete_media_file(old_url)

        current["login_banner_url"] = banner_url
        save_stored_whitelabel_data(current)

        logger.info(f"[WhiteLabel] Nova imagem de login enviada por {admin.email}: {banner_url}")
        return current
    except Exception as exc:
        logger.error(f"[WhiteLabel] Erro no upload de imagem de login: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao realizar upload da imagem de login."
        )


@router.delete("/login-banner", response_model=WhiteLabelConfig)
def reset_login_banner(
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Restaura a imagem padrão da tela de login (remove imagem customizada).
    """
    current = get_stored_whitelabel_data()
    old_url = current.get("login_banner_url")
    if old_url:
        delete_media_file(old_url)

    current["login_banner_url"] = None
    save_stored_whitelabel_data(current)
    logger.info(f"[WhiteLabel] Banner de login restaurado ao padrão por {admin.email}")
    return current
