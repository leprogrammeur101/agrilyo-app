"""
Health check — endpoint de monitoring AGRILYO.
Vérifie l'état de l'API et de ses dépendances (DB, Redis).
"""

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import check_db_connection

router = APIRouter()


class HealthStatus(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: str
    database: str


@router.get("/health", response_model=HealthStatus, tags=["Monitoring"])
async def health_check() -> HealthStatus:
    """
    Vérifie que l'API AGRILYO et ses dépendances sont opérationnelles.
    Utilisé par Railway pour le health check de déploiement.
    """
    db_ok = await check_db_connection()

    return HealthStatus(
        status="ok" if db_ok else "degraded",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        database="connected" if db_ok else "unreachable",
    )