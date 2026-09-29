"""
Endpoints de API para Gerenciamento de Logs dos Contêineres Docker.
Exclusivo para Super Administradores.
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from app.models.user import User
from app.api.v1.endpoints.users import require_superadmin
from app.services.docker_logs_service import fetch_container_logs, CONTAINER_SERVICES

router = APIRouter(prefix="/logs", tags=["Logs dos Contêineres"])

@router.get("/services")
def list_available_services(
    current_user: User = Depends(require_superadmin)
) -> List[Dict[str, str]]:
    """Retorna os serviços disponíveis para visualização de logs."""
    labels = {
        "backend": "Backend (FastAPI)",
        "frontend": "Frontend (Nginx / Vite)",
        "db": "Banco de Dados (PostgreSQL)",
    }
    return [
        {"id": key, "name": labels.get(key, key), "container": container}
        for key, container in CONTAINER_SERVICES.items()
    ]

@router.get("/{service_name}")
def get_service_logs(
    service_name: str,
    tail: int = Query(100, ge=10, le=1000, description="Quantidade de linhas de log a retornar"),
    current_user: User = Depends(require_superadmin)
) -> Dict[str, Any]:
    """Retorna as últimas linhas de log de um contêiner específico."""
    return fetch_container_logs(service_name=service_name.lower(), tail=tail)
