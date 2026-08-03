"""
Endpoints M3 Conseil - AGRILYO.
"""

import uuid
from typing import NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_authenticated_user
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.conseil import (
    AgronomeCreate,
    AgronomeListResponse,
    AgronomeResponse,
    AgronomeStatutUpdate,
    AgronomeUpdate,
    DemandeConseilAssign,
    DemandeConseilCreate,
    DemandeConseilListResponse,
    DemandeConseilResponse,
    DemandeConseilStatutUpdate,
    MatchingSuggestion,
    PlanningCulturalCreate,
    PlanningCulturalListResponse,
    PlanningCulturalResponse,
    PlanningCulturalUpdate,
    SessionConseilCreate,
    SessionConseilResponse,
    SessionConseilUpdate,
)
from app.services.matching_service import (
    ConseilError,
    assigner_demande_conseil,
    creer_agronome,
    creer_demande_conseil,
    creer_planning_cultural,
    creer_session_conseil,
    get_agronome,
    get_demande_conseil,
    get_mon_profil_agronome,
    get_planning,
    lister_agronomes,
    lister_mes_demandes_conseil,
    lister_mes_plannings,
    mettre_a_jour_statut_agronome,
    mettre_a_jour_statut_demande,
    modifier_mon_profil_agronome,
    modifier_planning,
    modifier_session_conseil,
    suggerer_agronomes,
)

router = APIRouter()


def _raise_conseil_error(error: ConseilError) -> NoReturn:
    raise HTTPException(status_code=error.status_code, detail=error.message)


def _require_admin(user: User) -> None:
    if not user.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Action reservee aux administrateurs")


@router.get(
    "/agronomes",
    response_model=AgronomeListResponse,
    summary="Lister les agronomes verifies",
)
async def lister_agronomes_endpoint(
    culture: str | None = Query(default=None),
    region: str | None = Query(default=None),
    specialite: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> AgronomeListResponse:
    return await lister_agronomes(
        db=db,
        culture=culture,
        region=region,
        specialite=specialite,
        page=page,
        size=size,
    )


@router.post(
    "/agronomes",
    response_model=AgronomeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer mon profil agronome",
)
async def creer_agronome_endpoint(
    data: AgronomeCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AgronomeResponse:
    try:
        return await creer_agronome(data=data, user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/agronomes/moi",
    response_model=AgronomeResponse,
    summary="Consulter mon profil agronome",
)
async def mon_agronome_endpoint(
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AgronomeResponse:
    try:
        return await get_mon_profil_agronome(user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.patch(
    "/agronomes/moi",
    response_model=AgronomeResponse,
    summary="Modifier mon profil agronome",
)
async def modifier_mon_agronome_endpoint(
    data: AgronomeUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AgronomeResponse:
    try:
        return await modifier_mon_profil_agronome(data=data, user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/agronomes/{agronome_id}",
    response_model=AgronomeResponse,
    summary="Detail d'un agronome",
)
async def get_agronome_endpoint(
    agronome_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AgronomeResponse:
    try:
        return await get_agronome(agronome_id=agronome_id, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.patch(
    "/agronomes/{agronome_id}/statut",
    response_model=AgronomeResponse,
    summary="Verifier, suspendre ou rejeter un agronome",
)
async def statut_agronome_endpoint(
    agronome_id: uuid.UUID,
    data: AgronomeStatutUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AgronomeResponse:
    _require_admin(current_user)
    try:
        return await mettre_a_jour_statut_agronome(agronome_id=agronome_id, data=data, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/demandes",
    response_model=DemandeConseilListResponse,
    summary="Lister mes demandes de conseil",
)
async def lister_mes_demandes_endpoint(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> DemandeConseilListResponse:
    return await lister_mes_demandes_conseil(
        user=current_user,
        db=db,
        page=page,
        size=size,
    )


@router.post(
    "/demandes",
    response_model=DemandeConseilResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer une demande de conseil",
)
async def creer_demande_endpoint(
    data: DemandeConseilCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> DemandeConseilResponse:
    try:
        return await creer_demande_conseil(data=data, user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/demandes/{demande_id}",
    response_model=DemandeConseilResponse,
    summary="Detail d'une demande de conseil",
)
async def get_demande_endpoint(
    demande_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> DemandeConseilResponse:
    try:
        return await get_demande_conseil(
            demande_id=demande_id,
            user=current_user,
            db=db,
        )
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/demandes/{demande_id}/matching",
    response_model=list[MatchingSuggestion],
    summary="Suggérer des agronomes pour une demande",
)
async def matching_demande_endpoint(
    demande_id: uuid.UUID,
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> list[MatchingSuggestion]:
    try:
        return await suggerer_agronomes(
            demande_id=demande_id,
            user=current_user,
            db=db,
            limit=limit,
        )
    except ConseilError as e:
        _raise_conseil_error(e)


@router.patch(
    "/demandes/{demande_id}/assigner",
    response_model=DemandeConseilResponse,
    summary="Assigner un agronome a une demande",
)
async def assigner_demande_endpoint(
    demande_id: uuid.UUID,
    data: DemandeConseilAssign,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> DemandeConseilResponse:
    _require_admin(current_user)
    try:
        return await assigner_demande_conseil(demande_id=demande_id, data=data, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.patch(
    "/demandes/{demande_id}/statut",
    response_model=DemandeConseilResponse,
    summary="Mettre a jour le statut d'une demande",
)
async def statut_demande_endpoint(
    demande_id: uuid.UUID,
    data: DemandeConseilStatutUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> DemandeConseilResponse:
    try:
        return await mettre_a_jour_statut_demande(
            demande_id=demande_id,
            data=data,
            user=current_user,
            db=db,
        )
    except ConseilError as e:
        _raise_conseil_error(e)


@router.post(
    "/sessions",
    response_model=SessionConseilResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer une session de conseil",
)
async def creer_session_endpoint(
    data: SessionConseilCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> SessionConseilResponse:
    try:
        return await creer_session_conseil(data=data, user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.patch(
    "/sessions/{session_id}",
    response_model=SessionConseilResponse,
    summary="Modifier une session de conseil",
)
async def modifier_session_endpoint(
    session_id: uuid.UUID,
    data: SessionConseilUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> SessionConseilResponse:
    try:
        return await modifier_session_conseil(
            session_id=session_id,
            data=data,
            user=current_user,
            db=db,
        )
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/plannings",
    response_model=PlanningCulturalListResponse,
    summary="Lister mes plannings culturaux",
)
async def lister_plannings_endpoint(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PlanningCulturalListResponse:
    return await lister_mes_plannings(user=current_user, db=db, page=page, size=size)


@router.post(
    "/plannings",
    response_model=PlanningCulturalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer un planning cultural",
)
async def creer_planning_endpoint(
    data: PlanningCulturalCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PlanningCulturalResponse:
    try:
        return await creer_planning_cultural(data=data, user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.get(
    "/plannings/{planning_id}",
    response_model=PlanningCulturalResponse,
    summary="Detail d'un planning cultural",
)
async def get_planning_endpoint(
    planning_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PlanningCulturalResponse:
    try:
        return await get_planning(planning_id=planning_id, user=current_user, db=db)
    except ConseilError as e:
        _raise_conseil_error(e)


@router.patch(
    "/plannings/{planning_id}",
    response_model=PlanningCulturalResponse,
    summary="Modifier un planning cultural",
)
async def modifier_planning_endpoint(
    planning_id: uuid.UUID,
    data: PlanningCulturalUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PlanningCulturalResponse:
    try:
        return await modifier_planning(
            planning_id=planning_id,
            data=data,
            user=current_user,
            db=db,
        )
    except ConseilError as e:
        _raise_conseil_error(e)
