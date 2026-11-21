import os
import json
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course
from app.schemas.whitelabel import WhiteLabelConfig, WhiteLabelUpdate
from app.api.v1.endpoints.users import get_current_user
from app.services.storage import upload_media_file, delete_media_file
from app.services.image_optimizer import optimize_image

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
        "pwa_app_name": None,
        "login_banner_url": None,
        "logo_url": None,
        "pwa_icon_url": None,
        "logo_size": "medium",
        "bg_color": "#090d16",
        "is_astrology_platform": False,
        "community_feed_students_enabled": False,
    }
    if os.path.exists(PLATFORM_THEME_FILE):
        try:
            with open(PLATFORM_THEME_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {
                    "platform_name": data.get("platform_name") or default_data["platform_name"],
                    "pwa_app_name": data.get("pwa_app_name") or None,
                    "login_banner_url": data.get("login_banner_url") or None,
                    "logo_url": data.get("logo_url") or None,
                    "pwa_icon_url": data.get("pwa_icon_url") or None,
                    "logo_size": data.get("logo_size") or default_data["logo_size"],
                    "bg_color": data.get("bg_color") or default_data["bg_color"],
                    "is_astrology_platform": bool(data.get("is_astrology_platform", False)),
                    "community_feed_students_enabled": bool(data.get("community_feed_students_enabled", False)),
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


@router.get("/manifest.webmanifest")
def get_dynamic_manifest():
    """
    Gera o Web App Manifest (PWA) dinamicamente com o nome, cor de tema e ícone PWA WhiteLabel.
    """
    data = get_stored_whitelabel_data()
    platform_name = (data.get("platform_name") or "Área de Membros").strip() or "Área de Membros"
    app_name = (data.get("pwa_app_name") or platform_name).strip() or platform_name
    bg_color = data.get("bg_color") or "#090d16"
    effective_icon = data.get("pwa_icon_url") or data.get("logo_url")

    icons = []
    if effective_icon:
        icons.append({
            "src": effective_icon,
            "sizes": "192x192",
            "purpose": "any",
        })
        icons.append({
            "src": effective_icon,
            "sizes": "512x512",
            "purpose": "any maskable" if data.get("pwa_icon_url") else "any",
        })
    icons.extend([
        {
            "src": "/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable",
        },
        {
            "src": "/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable",
        },
    ])

    manifest = {
        "name": app_name,
        "short_name": app_name[:24],
        "description": f"Acesse seus cursos e conteúdos em {app_name}.",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "orientation": "portrait-primary",
        "theme_color": bg_color,
        "background_color": bg_color,
        "icons": icons,
    }
    return JSONResponse(content=manifest, media_type="application/manifest+json")


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

    if settings_in.pwa_app_name is not None:
        clean_pwa_name = settings_in.pwa_app_name.strip()
        current["pwa_app_name"] = clean_pwa_name if clean_pwa_name else None

    if settings_in.login_banner_url is not None:
        current["login_banner_url"] = settings_in.login_banner_url.strip() if settings_in.login_banner_url.strip() else None

    if settings_in.logo_url is not None:
        current["logo_url"] = settings_in.logo_url.strip() if settings_in.logo_url.strip() else None

    if settings_in.pwa_icon_url is not None:
        current["pwa_icon_url"] = settings_in.pwa_icon_url.strip() if settings_in.pwa_icon_url.strip() else None

    if settings_in.logo_size is not None:
        current["logo_size"] = settings_in.logo_size

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

    if settings_in.is_astrology_platform is not None:
        if admin.role != "superadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Super Admin pode alterar a configuração de Astrologia / nicho da plataforma."
            )
        current["is_astrology_platform"] = bool(settings_in.is_astrology_platform)

    if settings_in.community_feed_students_enabled is not None:
        current["community_feed_students_enabled"] = bool(settings_in.community_feed_students_enabled)

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


@router.post("/logo", response_model=WhiteLabelConfig)
async def upload_platform_logo(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Faz upload de um novo logotipo da plataforma (PNG, JPG, WEBP, SVG).
    Otimiza automaticamente imagens raster para carregamento rápido e armazena no Backblaze B2 com fallback local.
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
        upload_bytes = content
        upload_content_type = file.content_type or "image/png"
        out_ext = file_ext

        if file_ext != ".svg":
            upload_bytes, upload_content_type, out_ext = optimize_image(
                content,
                max_width=256,
                quality=85,
                output_format="WEBP",
            )

        unique_filename = f"platform_logo_{uuid.uuid4().hex[:12]}{out_ext}"

        b2_url = upload_media_file(
            file_bytes=upload_bytes,
            filename=unique_filename,
            content_type=upload_content_type,
            folder="AreaDeMembros/logos/"
        )

        if b2_url:
            logo_url = b2_url
        else:
            local_path = os.path.join(THUMBNAILS_DIR, unique_filename)
            with open(local_path, "wb") as f:
                f.write(upload_bytes)
            logo_url = f"/api/v1/courses/thumbnails/{unique_filename}"

        current = get_stored_whitelabel_data()
        old_url = current.get("logo_url")
        if old_url:
            background_tasks.add_task(delete_media_file, old_url)

        current["logo_url"] = logo_url
        save_stored_whitelabel_data(current)

        logger.info(f"[WhiteLabel] Novo logotipo enviado por {admin.email} ({len(content)}B -> {len(upload_bytes)}B): {logo_url}")
        return current
    except Exception as exc:
        logger.error(f"[WhiteLabel] Erro no upload de logotipo: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao realizar upload do logotipo da plataforma."
        )


@router.delete("/logo", response_model=WhiteLabelConfig)
def reset_platform_logo(
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Restaura o logotipo padrão da plataforma (remove imagem customizada).
    """
    current = get_stored_whitelabel_data()
    old_url = current.get("logo_url")
    if old_url:
        delete_media_file(old_url)

    current["logo_url"] = None
    save_stored_whitelabel_data(current)
    logger.info(f"[WhiteLabel] Logotipo da plataforma restaurado ao padrão por {admin.email}")
    return current


@router.post("/pwa-icon", response_model=WhiteLabelConfig)
async def upload_pwa_icon(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Faz upload do ícone personalizado do App PWA (PNG, JPG, WEBP, SVG).
    Otimiza imagens raster para 512px PNG para máxima compatibilidade em Android e iOS.
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
        upload_bytes = content
        upload_content_type = file.content_type or "image/png"
        out_ext = file_ext

        if file_ext != ".svg":
            upload_bytes, upload_content_type, out_ext = optimize_image(
                content,
                max_width=512,
                quality=90,
                output_format="PNG",
            )

        unique_filename = f"pwa_icon_{uuid.uuid4().hex[:12]}{out_ext}"

        b2_url = upload_media_file(
            file_bytes=upload_bytes,
            filename=unique_filename,
            content_type=upload_content_type,
            folder="AreaDeMembros/pwa_icons/"
        )

        if b2_url:
            pwa_icon_url = b2_url
        else:
            local_path = os.path.join(THUMBNAILS_DIR, unique_filename)
            with open(local_path, "wb") as f:
                f.write(upload_bytes)
            pwa_icon_url = f"/api/v1/courses/thumbnails/{unique_filename}"

        current = get_stored_whitelabel_data()
        old_url = current.get("pwa_icon_url")
        if old_url:
            background_tasks.add_task(delete_media_file, old_url)

        current["pwa_icon_url"] = pwa_icon_url
        save_stored_whitelabel_data(current)

        logger.info(f"[WhiteLabel] Novo ícone PWA enviado por {admin.email}: {pwa_icon_url}")
        return current
    except Exception as exc:
        logger.error(f"[WhiteLabel] Erro no upload de ícone PWA: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao realizar upload do ícone PWA."
        )


@router.delete("/pwa-icon", response_model=WhiteLabelConfig)
def reset_pwa_icon(
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Remove o ícone PWA personalizado, voltando ao fallback (logo da plataforma ou ícone padrão).
    """
    current = get_stored_whitelabel_data()
    old_url = current.get("pwa_icon_url")
    if old_url:
        delete_media_file(old_url)

    current["pwa_icon_url"] = None
    save_stored_whitelabel_data(current)
    logger.info(f"[WhiteLabel] Ícone PWA restaurado ao padrão por {admin.email}")
    return current

