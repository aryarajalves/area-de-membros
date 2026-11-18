from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user
from app.models.push_token import UserDeviceToken
from app.models.user import User
from app.services.push_notification_service import (
    is_push_configured,
    register_device_token,
    unregister_device_token,
)

router = APIRouter()


class PushRegisterRequest(BaseModel):
    fcm_token: str = Field(..., min_length=10, max_length=512)
    platform: str = Field(default="android", max_length=20)
    device_name: Optional[str] = Field(default=None, max_length=120)


class PushUnregisterRequest(BaseModel):
    fcm_token: str = Field(..., min_length=10, max_length=512)


@router.post("/register", status_code=status.HTTP_200_OK)
def register_push_token(
    payload: PushRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra ou atualiza o token FCM do dispositivo do usuário autenticado."""
    if not payload.fcm_token.strip():
        raise HTTPException(status_code=400, detail="Token FCM inválido.")

    record = register_device_token(
        db=db,
        user_id=current_user.id,
        fcm_token=payload.fcm_token,
        platform=payload.platform,
        device_name=payload.device_name,
    )
    return {
        "status": "registered",
        "id": record.id,
        "platform": record.platform,
        "firebase_configured": is_push_configured(),
    }


@router.delete("/unregister", status_code=status.HTTP_200_OK)
def unregister_push_token(
    payload: PushUnregisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove o token FCM do dispositivo ao fazer logout."""
    removed = unregister_device_token(
        db=db,
        user_id=current_user.id,
        fcm_token=payload.fcm_token,
    )
    return {"status": "unregistered" if removed else "not_found", "removed": removed}


@router.get("/status", status_code=status.HTTP_200_OK)
def get_push_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna o status de Push Notifications para o usuário autenticado."""
    active_count = (
        db.query(UserDeviceToken)
        .filter(UserDeviceToken.user_id == current_user.id, UserDeviceToken.is_active.is_(True))
        .count()
    )
    return {
        "firebase_configured": is_push_configured(),
        "active_devices_count": active_count,
    }
