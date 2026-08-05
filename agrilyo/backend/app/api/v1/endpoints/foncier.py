"""
Endpoints M1 Foncier — AGRILYO (corrigé)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_authenticated_user
from app.core.database import get_db
from app.models.foncier import BadgeSecurite, TypeAcces, StatutJuridique
from app.models.user import User, UserRole
from app.schemas.foncier import (
    AnnonceFiltres, AnnonceCreate, AnnonceListResponse,
    AnnonceResponse, AnnonceUpdate, BadgeUpdate,
)
from app.services.foncier_service import (
    AnnonceAccessDeniedError, AnnonceNotFoundError,
    creer_annonce, get_annonce_by_id, lister_annonces,
    mes_annonces, mettre_a_jour_badge, modifier_annonce,
)

router = APIRouter()

@router.get(
    "",
    response_model=AnnonceListResponse,
    summary="Lister les annonces foncières",
)
async def lister_annonces_endpoint(
    region: str | None = Query(default=None),
    type_acces: TypeAcces | None = Query(default=None),
    badge: BadgeSecurite | None = Query(default=None),
    statut_juridique: StatutJuridique | None = Query(default=None),
    superficie_min: float | None = Query(default=None, gt=0),
    superficie_max: float | None = Query(default=None, gt=0),
    prix_max: float | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> AnnonceListResponse:
    filtres = AnnonceFiltres(
        region=region, type_acces=type_acces, badge=badge,
        statut_juridique=statut_juridique, superficie_min=superficie_min,
        superficie_max=superficie_max, prix_max=prix_max,
        page=page, size=size,
    )
    return await lister_annonces(filtres=filtres, db=db)

@router.post(
    "",
    response_model=AnnonceResponse,
    status_code=201,
    summary="Créer une annonce foncière",
)
async def creer_annonce_endpoint(
    data: AnnonceCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AnnonceResponse:
    # ✅ CORRIGÉ : persistance explicite du rôle
    if not current_user.has_role(UserRole.BAILLEUR):
        current_user.add_role(UserRole.BAILLEUR)
        db.add(current_user)  # Marque l'objet comme dirty
        await db.commit()     # Persiste immédiatement
        await db.refresh(current_user)

    annonce = await creer_annonce(data=data, bailleur=current_user, db=db)
    annonce = await get_annonce_by_id(annonce.id, db)
    return AnnonceResponse.model_validate(annonce)

@router.get(
    "/mes-annonces",
    response_model=AnnonceListResponse,
    summary="Mes annonces foncières",
)
async def mes_annonces_endpoint(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AnnonceListResponse:
    return await mes_annonces(user=current_user, db=db, page=page, size=size)

@router.get(
    "/{annonce_id}",
    response_model=AnnonceResponse,
    summary="Détail d'une annonce foncière",
)
async def detail_annonce_endpoint(
    annonce_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AnnonceResponse:
    try:
        annonce = await get_annonce_by_id(annonce_id, db)
        return AnnonceResponse.model_validate(annonce)
    except AnnonceNotFoundError:
        raise HTTPException(status_code=404, detail="Annonce introuvable")

@router.patch(
    "/{annonce_id}",
    response_model=AnnonceResponse,
    summary="Modifier une annonce",
)
async def modifier_annonce_endpoint(
    annonce_id: uuid.UUID,
    data: AnnonceUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AnnonceResponse:
    try:
        annonce = await modifier_annonce(
            annonce_id=annonce_id, data=data, user=current_user, db=db,
        )
        return AnnonceResponse.model_validate(annonce)
    except AnnonceNotFoundError:
        raise HTTPException(status_code=404, detail="Annonce introuvable")
    except AnnonceAccessDeniedError:
        raise HTTPException(status_code=403, detail="Accès refusé")

@router.patch(
    "/{annonce_id}/badge",
    response_model=AnnonceResponse,
    summary="Mettre à jour le badge sécurité (Admin)",
)
async def badge_annonce_endpoint(
    annonce_id: uuid.UUID,
    data: BadgeUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AnnonceResponse:
    if not current_user.has_role(UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail="Seul un administrateur peut attribuer un badge sécurité"
        )
    try:
        annonce = await mettre_a_jour_badge(annonce_id=annonce_id, data=data, db=db)
        return AnnonceResponse.model_validate(annonce)
    except AnnonceNotFoundError:
        raise HTTPException(status_code=404, detail="Annonce introuvable")