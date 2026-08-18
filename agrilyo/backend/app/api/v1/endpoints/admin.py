"""
Endpoints Admin AGRILYO — consommés exclusivement par le back-office web.
Toutes les routes de ce routeur sont réservées au rôle ADMIN (via `require_admin`).

Note d'architecture : la validation des profils Agronome/Fournisseur délègue
aux fonctions de service existantes (matching_service / semences_service) —
les anciens endpoints `/conseil/agronomes/{id}/statut` et
`/semences/fournisseurs/{id}/statut` restent disponibles en parallèle
(pas de breaking change), ce routeur ne fait qu'exposer une façade admin
plus stricte (garde EN_ATTENTE obligatoire, forme de requête dédiée).
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import require_admin
from app.core.database import get_db
from app.models.conseil import Agronome, StatutAgronome
from app.models.foncier import BadgeSecurite
from app.models.semences import FournisseurSemences, StatutFournisseur
from app.models.user import User
from app.schemas.admin import (
    AgronomeValidateRequest,
    FournisseurValidateRequest,
    KPIResponse,
    UserAdminListResponse,
    UserAdminResume,
    UserStatusUpdateRequest,
)
from app.schemas.conseil import AgronomeListResponse, AgronomeResponse, AgronomeStatutUpdate
from app.schemas.contrat import LitigeListResponse, LitigeResponse
from app.schemas.foncier import AnnonceFiltres, AnnonceListResponse
from app.schemas.semences import FournisseurListResponse, FournisseurResponse, FournisseurStatutUpdate
from app.services.admin_service import (
    AdminError,
    get_kpis,
    lister_agronomes_par_statut,
    lister_fournisseurs_par_statut,
    lister_users,
    mettre_a_jour_statut_user,
)
from app.services.contrat_service import lister_litiges
from app.services.foncier_service import lister_annonces
from app.services.matching_service import ConseilError, mettre_a_jour_statut_agronome
from app.services.semences_service import SemencesError, mettre_a_jour_statut_fournisseur

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════════
# Utilisateurs
# ═══════════════════════════════════════════════════════════════════════════════

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
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserAdminListResponse:
    return await lister_users(db=db, role=role, status=status, search=search, page=page, size=size)


@router.patch(
    "/users/{user_id}/status",
    response_model=UserAdminResume,
    summary="[Admin] Suspendre ou réactiver un compte utilisateur",
)
async def update_user_status_endpoint(
    user_id: uuid.UUID,
    data: UserStatusUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserAdminResume:
    try:
        return await mettre_a_jour_statut_user(db=db, user_id=user_id, data=data, admin=current_user)
    except AdminError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Agronomes
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/agronomes",
    response_model=AgronomeListResponse,
    summary="[Admin] File de validation des agronomes (EN_ATTENTE par défaut)",
)
async def lister_agronomes_admin_endpoint(
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AgronomeListResponse:
    return await lister_agronomes_par_statut(db=db, statut=statut, page=page, size=size)


@router.patch(
    "/agronomes/{agronome_id}/validate",
    response_model=AgronomeResponse,
    summary="[Admin] Valider ou rejeter un profil agronome EN_ATTENTE",
)
async def validate_agronome_endpoint(
    agronome_id: uuid.UUID,
    data: AgronomeValidateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AgronomeResponse:
    agronome = await db.get(Agronome, agronome_id)
    if not agronome:
        raise HTTPException(status_code=404, detail="Agronome introuvable")
    if agronome.statut != StatutAgronome.EN_ATTENTE:
        raise HTTPException(
            status_code=400,
            detail=f"Ce profil n'est pas en attente (statut actuel : {agronome.statut.value}).",
        )
    try:
        return await mettre_a_jour_statut_agronome(
            agronome_id=agronome_id,
            data=AgronomeStatutUpdate(statut=StatutAgronome(data.decision), note_admin=data.motif),
            db=db,
        )
    except ConseilError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Fournisseurs
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/fournisseurs",
    response_model=FournisseurListResponse,
    summary="[Admin] File de validation des fournisseurs (EN_ATTENTE par défaut)",
)
async def lister_fournisseurs_admin_endpoint(
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> FournisseurListResponse:
    return await lister_fournisseurs_par_statut(db=db, statut=statut, page=page, size=size)


@router.patch(
    "/fournisseurs/{fournisseur_id}/validate",
    response_model=FournisseurResponse,
    summary="[Admin] Valider ou rejeter un profil fournisseur EN_ATTENTE",
)
async def validate_fournisseur_endpoint(
    fournisseur_id: uuid.UUID,
    data: FournisseurValidateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    fournisseur = await db.get(FournisseurSemences, fournisseur_id)
    if not fournisseur:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")
    if fournisseur.statut != StatutFournisseur.EN_ATTENTE:
        raise HTTPException(
            status_code=400,
            detail=f"Ce fournisseur n'est pas en attente (statut actuel : {fournisseur.statut.value}).",
        )
    try:
        updated = await mettre_a_jour_statut_fournisseur(
            fournisseur_id=fournisseur_id,
            data=FournisseurStatutUpdate(statut=StatutFournisseur(data.decision), note_admin=data.motif),
            db=db,
        )
        return FournisseurResponse.model_validate(updated)
    except SemencesError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Foncier — alias en lecture (l'action de modération reste
# PATCH /foncier/annonces/{id}/badge, déjà admin-only et déjà utilisée)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/foncier/annonces",
    response_model=AnnonceListResponse,
    summary="[Admin] Lister les annonces foncières (modération par badge)",
)
async def lister_annonces_admin_endpoint(
    badge: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AnnonceListResponse:
    filtres = AnnonceFiltres(
        badge=BadgeSecurite(badge) if badge else None, page=page, size=size
    )
    return await lister_annonces(filtres=filtres, db=db)


# ═══════════════════════════════════════════════════════════════════════════════
# Litiges — alias en lecture (l'action reste PATCH /foncier/litiges/{id}/resoudre,
# déjà admin-only et déjà utilisée)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/litiges",
    response_model=LitigeListResponse,
    summary="[Admin] Lister les litiges fonciers",
)
async def lister_litiges_admin_endpoint(
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> LitigeListResponse:
    items, total, pages = await lister_litiges(db=db, statut=statut, page=page, size=size)
    return LitigeListResponse(
        items=[LitigeResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# KPIs
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/kpis",
    response_model=KPIResponse,
    summary="[Admin] Chiffres clés du tableau de bord",
)
async def kpis_endpoint(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> KPIResponse:
    return await get_kpis(db=db)