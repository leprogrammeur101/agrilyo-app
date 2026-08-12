"""
Endpoints Admin AGRILYO — consommés exclusivement par le back-office web.
Toutes les routes de ce routeur sont réservées au rôle ADMIN.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_authenticated_user
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.admin import KPIResponse, UserAdminListResponse
from app.schemas.conseil import AgronomeListResponse
from app.schemas.semences import FournisseurListResponse
from app.services.admin_service import (
    get_kpis,
    lister_agronomes_par_statut,
    lister_fournisseurs_par_statut,
    lister_users,
)

router = APIRouter()


def _require_admin(user: User) -> None:
    if not user.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Action réservée aux administrateurs")


@router.get(
    "/users",
    response_model=UserAdminListResponse,
    summary="[Admin] Lister les utilisateurs",
)
async def lister_users_endpoint(
    role: str | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> UserAdminListResponse:
    _require_admin(current_user)
    return await lister_users(db=db, role=role, status=status, search=search, page=page, size=size)


@router.get(
    "/agronomes",
    response_model=AgronomeListResponse,
    summary="[Admin] File de validation des agronomes (EN_ATTENTE par défaut)",
)
async def lister_agronomes_admin_endpoint(
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AgronomeListResponse:
    _require_admin(current_user)
    return await lister_agronomes_par_statut(db=db, statut=statut, page=page, size=size)


@router.get(
    "/fournisseurs",
    response_model=FournisseurListResponse,
    summary="[Admin] File de validation des fournisseurs (EN_ATTENTE par défaut)",
)
async def lister_fournisseurs_admin_endpoint(
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> FournisseurListResponse:
    _require_admin(current_user)
    return await lister_fournisseurs_par_statut(db=db, statut=statut, page=page, size=size)


@router.get(
    "/kpis",
    response_model=KPIResponse,
    summary="[Admin] Chiffres clés du tableau de bord",
)
async def kpis_endpoint(
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> KPIResponse:
    _require_admin(current_user)
    return await get_kpis(db=db)