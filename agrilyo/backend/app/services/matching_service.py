"""
Service M3 Conseil AGRILYO.

Logique metier initiale pour profils agronomes, demandes de conseil,
matching MVP, sessions et plannings culturaux.
"""

import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conseil import (
    Agronome,
    DemandeConseil,
    OperationPlanning,
    PlanningCultural,
    SessionConseil,
    StatutAgronome,
    StatutDemandeConseil,
    StatutSessionConseil,
)
from app.models.user import User, UserRole
from app.schemas.conseil import (
    AgronomeCreate,
    AgronomeListResponse,
    AgronomeResponse,
    AgronomeResume,
    AgronomeStatutUpdate,
    AgronomeUpdate,
    DemandeConseilAssign,
    DemandeConseilCreate,
    DemandeConseilListResponse,
    DemandeConseilResponse,
    DemandeConseilResume,
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


class ConseilError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


class AgronomeNotFoundError(ConseilError):
    def __init__(self):
        super().__init__("Agronome introuvable", 404)


class DemandeConseilNotFoundError(ConseilError):
    def __init__(self):
        super().__init__("Demande de conseil introuvable", 404)


class PlanningNotFoundError(ConseilError):
    def __init__(self):
        super().__init__("Planning cultural introuvable", 404)


class ConseilAccessDeniedError(ConseilError):
    def __init__(self, message: str = "Acces refuse"):
        super().__init__(message, 403)


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


def _pages(total: int, size: int) -> int:
    return max(1, -(-total // size))


def _agronome_resume(agronome: Agronome) -> AgronomeResume:
    return AgronomeResume.model_validate(agronome)


def _demande_resume(demande: DemandeConseil) -> DemandeConseilResume:
    return DemandeConseilResume.model_validate(demande)


def _demande_response(demande: DemandeConseil) -> DemandeConseilResponse:
    data = DemandeConseilResponse.model_validate(demande)
    data.metadata = demande.metadata_contexte
    return data


def _score_agronome(agronome: Agronome, demande: DemandeConseil) -> tuple[float, list[str]]:
    score = 0.0
    raisons: list[str] = []
    culture = _norm(demande.culture)
    region = _norm(demande.region)
    specialites = {_norm(item) for item in agronome.specialites}
    cultures = {_norm(item) for item in agronome.cultures}
    regions = {_norm(item) for item in agronome.regions_couvertes}

    if culture and culture in cultures:
        score += 35
        raisons.append("Culture maitrisee")
    if region and region in regions:
        score += 30
        raisons.append("Region couverte")
    if demande.urgence and (
        "phytosanitaire" in specialites or "diagnostic" in specialites
    ):
        score += 15
        raisons.append("Specialite adaptee aux urgences")
    if agronome.annees_experience >= 5:
        score += 10
        raisons.append("Experience confirmee")
    if agronome.note_moyenne >= 4:
        score += 10
        raisons.append("Bonne evaluation")

    return min(score, 100.0), raisons


async def _get_mon_agronome(user: User, db: AsyncSession) -> Agronome:
    result = await db.execute(select(Agronome).where(Agronome.user_id == user.id))
    agronome = result.scalar_one_or_none()
    if not agronome:
        raise AgronomeNotFoundError()
    return agronome


async def _get_demande(demande_id: uuid.UUID, db: AsyncSession) -> DemandeConseil:
    result = await db.execute(
        select(DemandeConseil)
        .options(selectinload(DemandeConseil.sessions), selectinload(DemandeConseil.plannings))
        .where(DemandeConseil.id == demande_id)
    )
    demande = result.scalar_one_or_none()
    if not demande:
        raise DemandeConseilNotFoundError()
    return demande


async def creer_agronome(
    data: AgronomeCreate,
    user: User,
    db: AsyncSession,
) -> AgronomeResponse:
    existing = await db.execute(select(Agronome.id).where(Agronome.user_id == user.id))
    if existing.scalar_one_or_none():
        raise ConseilError("Un profil agronome existe deja pour cet utilisateur", 409)

    agronome = Agronome(user_id=user.id, **data.model_dump())
    db.add(agronome)
    user.add_role(UserRole.AGRONOME)
    await db.flush()
    return AgronomeResponse.model_validate(agronome)


async def get_agronome(
    agronome_id: uuid.UUID,
    db: AsyncSession,
) -> AgronomeResponse:
    agronome = await db.get(Agronome, agronome_id)
    if not agronome:
        raise AgronomeNotFoundError()
    return AgronomeResponse.model_validate(agronome)


async def get_mon_profil_agronome(
    user: User,
    db: AsyncSession,
) -> AgronomeResponse:
    agronome = await _get_mon_agronome(user=user, db=db)
    return AgronomeResponse.model_validate(agronome)


async def modifier_mon_profil_agronome(
    data: AgronomeUpdate,
    user: User,
    db: AsyncSession,
) -> AgronomeResponse:
    agronome = await _get_mon_agronome(user=user, db=db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(agronome, key, value)
    await db.flush()
    return AgronomeResponse.model_validate(agronome)


async def lister_agronomes(
    db: AsyncSession,
    culture: str | None = None,
    region: str | None = None,
    specialite: str | None = None,
    page: int = 1,
    size: int = 20,
) -> AgronomeListResponse:
    query = select(Agronome).where(Agronome.statut == StatutAgronome.VERIFIE)
    if culture:
        query = query.where(Agronome.cultures.any(culture))
    if region:
        query = query.where(Agronome.regions_couvertes.any(region))
    if specialite:
        query = query.where(Agronome.specialites.any(specialite))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    result = await db.execute(
        query.order_by(Agronome.note_moyenne.desc(), Agronome.annees_experience.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    agronomes = result.scalars().all()
    return AgronomeListResponse(
        items=[_agronome_resume(item) for item in agronomes],
        total=total,
        page=page,
        size=size,
        pages=_pages(total, size),
    )


async def mettre_a_jour_statut_agronome(
    agronome_id: uuid.UUID,
    data: AgronomeStatutUpdate,
    db: AsyncSession,
) -> AgronomeResponse:
    agronome = await db.get(Agronome, agronome_id)
    if not agronome:
        raise AgronomeNotFoundError()
    agronome.statut = data.statut
    agronome.note_admin = data.note_admin
    if data.statut == StatutAgronome.VERIFIE:
        agronome.verifie_le = datetime.now(timezone.utc)
    await db.flush()
    return AgronomeResponse.model_validate(agronome)


async def creer_demande_conseil(
    data: DemandeConseilCreate,
    user: User,
    db: AsyncSession,
) -> DemandeConseilResponse:
    payload = data.model_dump()
    metadata = payload.pop("metadata", None)
    demande = DemandeConseil(
        agriculteur_id=user.id,
        metadata_contexte=metadata,
        **payload,
    )
    db.add(demande)
    await db.flush()
    return _demande_response(demande)


async def lister_mes_demandes_conseil(
    user: User,
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
) -> DemandeConseilListResponse:
    query = (
        select(DemandeConseil)
        .where(DemandeConseil.agriculteur_id == user.id)
        .order_by(DemandeConseil.created_at.desc())
    )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    result = await db.execute(query.offset((page - 1) * size).limit(size))
    demandes = result.scalars().all()
    return DemandeConseilListResponse(
        items=[_demande_resume(item) for item in demandes],
        total=total,
        page=page,
        size=size,
        pages=_pages(total, size),
    )


async def get_demande_conseil(
    demande_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> DemandeConseilResponse:
    demande = await _get_demande(demande_id=demande_id, db=db)
    if demande.agriculteur_id != user.id and not user.has_role(UserRole.ADMIN):
        if not demande.agronome_id:
            raise ConseilAccessDeniedError()
        agronome = await _get_mon_agronome(user=user, db=db)
        if demande.agronome_id != agronome.id:
            raise ConseilAccessDeniedError()
    return _demande_response(demande)


async def suggerer_agronomes(
    demande_id: uuid.UUID,
    user: User,
    db: AsyncSession,
    limit: int = 5,
) -> List[MatchingSuggestion]:
    demande = await _get_demande(demande_id=demande_id, db=db)
    if demande.agriculteur_id != user.id and not user.has_role(UserRole.ADMIN):
        raise ConseilAccessDeniedError()

    result = await db.execute(
        select(Agronome).where(Agronome.statut == StatutAgronome.VERIFIE)
    )
    suggestions: list[MatchingSuggestion] = []
    for agronome in result.scalars().all():
        score, raisons = _score_agronome(agronome=agronome, demande=demande)
        if score > 0:
            suggestions.append(
                MatchingSuggestion(
                    agronome=_agronome_resume(agronome),
                    score=score,
                    raisons=raisons,
                )
            )

    suggestions.sort(key=lambda item: item.score, reverse=True)
    return suggestions[:limit]


async def assigner_demande_conseil(
    demande_id: uuid.UUID,
    data: DemandeConseilAssign,
    db: AsyncSession,
) -> DemandeConseilResponse:
    demande = await _get_demande(demande_id=demande_id, db=db)
    agronome = await db.get(Agronome, data.agronome_id)
    if not agronome:
        raise AgronomeNotFoundError()
    if agronome.statut != StatutAgronome.VERIFIE:
        raise ConseilError("Seul un agronome verifie peut etre assigne", 400)

    demande.agronome_id = agronome.id
    demande.score_matching = data.score_matching
    demande.statut = StatutDemandeConseil.ASSIGNEE
    demande.assigned_at = datetime.now(timezone.utc)
    await db.flush()
    return _demande_response(demande)


async def mettre_a_jour_statut_demande(
    demande_id: uuid.UUID,
    data: DemandeConseilStatutUpdate,
    user: User,
    db: AsyncSession,
) -> DemandeConseilResponse:
    demande = await _get_demande(demande_id=demande_id, db=db)
    if not user.has_role(UserRole.ADMIN):
        agronome = await _get_mon_agronome(user=user, db=db)
        if demande.agronome_id != agronome.id:
            raise ConseilAccessDeniedError()

    demande.statut = data.statut
    if data.statut in {StatutDemandeConseil.TERMINEE, StatutDemandeConseil.ANNULEE}:
        demande.closed_at = datetime.now(timezone.utc)
    await db.flush()
    return _demande_response(demande)


async def creer_session_conseil(
    data: SessionConseilCreate,
    user: User,
    db: AsyncSession,
) -> SessionConseilResponse:
    demande = await _get_demande(demande_id=data.demande_id, db=db)
    if not demande.agronome_id:
        raise ConseilError("La demande doit etre assignee avant de creer une session", 400)
    agronome = await _get_mon_agronome(user=user, db=db)
    if demande.agronome_id != agronome.id and not user.has_role(UserRole.ADMIN):
        raise ConseilAccessDeniedError()

    session = SessionConseil(
        demande_id=demande.id,
        agronome_id=demande.agronome_id,
        agriculteur_id=demande.agriculteur_id,
        canal=data.canal,
        scheduled_at=data.scheduled_at,
    )
    demande.statut = StatutDemandeConseil.EN_COURS
    db.add(session)
    await db.flush()
    return SessionConseilResponse.model_validate(session)


async def modifier_session_conseil(
    session_id: uuid.UUID,
    data: SessionConseilUpdate,
    user: User,
    db: AsyncSession,
) -> SessionConseilResponse:
    session = await db.get(SessionConseil, session_id)
    if not session:
        raise ConseilError("Session de conseil introuvable", 404)
    if not user.has_role(UserRole.ADMIN):
        agronome = await _get_mon_agronome(user=user, db=db)
        if session.agronome_id != agronome.id:
            raise ConseilAccessDeniedError()

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    if data.statut == StatutSessionConseil.TERMINEE:
        agronome = await db.get(Agronome, session.agronome_id)
        if agronome:
            agronome.nombre_sessions += 1
    await db.flush()
    return SessionConseilResponse.model_validate(session)


async def creer_planning_cultural(
    data: PlanningCulturalCreate,
    user: User,
    db: AsyncSession,
) -> PlanningCulturalResponse:
    agronome: Agronome | None = None
    if user.has_role(UserRole.AGRONOME):
        agronome = await _get_mon_agronome(user=user, db=db)

    agriculteur_id = user.id
    if data.demande_id:
        demande = await _get_demande(demande_id=data.demande_id, db=db)
        if agronome and demande.agronome_id != agronome.id and not user.has_role(UserRole.ADMIN):
            raise ConseilAccessDeniedError()
        if not agronome and demande.agriculteur_id != user.id and not user.has_role(UserRole.ADMIN):
            raise ConseilAccessDeniedError()
        agriculteur_id = demande.agriculteur_id

    payload = data.model_dump(exclude={"operations"})
    planning = PlanningCultural(
        agriculteur_id=agriculteur_id,
        agronome_id=agronome.id if agronome else None,
        **payload,
    )
    for operation in data.operations:
        planning.operations.append(OperationPlanning(**operation.model_dump()))
    db.add(planning)
    await db.flush()
    await db.refresh(planning, attribute_names=["operations"])
    return PlanningCulturalResponse.model_validate(planning)


async def lister_mes_plannings(
    user: User,
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
) -> PlanningCulturalListResponse:
    query = (
        select(PlanningCultural)
        .options(selectinload(PlanningCultural.operations))
        .where(PlanningCultural.agriculteur_id == user.id)
        .order_by(PlanningCultural.created_at.desc())
    )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    result = await db.execute(query.offset((page - 1) * size).limit(size))
    plannings = result.scalars().all()
    return PlanningCulturalListResponse(
        items=[PlanningCulturalResponse.model_validate(item) for item in plannings],
        total=total,
        page=page,
        size=size,
        pages=_pages(total, size),
    )


async def get_planning(
    planning_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> PlanningCulturalResponse:
    result = await db.execute(
        select(PlanningCultural)
        .options(selectinload(PlanningCultural.operations))
        .where(PlanningCultural.id == planning_id)
    )
    planning = result.scalar_one_or_none()
    if not planning:
        raise PlanningNotFoundError()
    if planning.agriculteur_id != user.id and not user.has_role(UserRole.ADMIN):
        if not planning.agronome_id:
            raise ConseilAccessDeniedError()
        agronome = await _get_mon_agronome(user=user, db=db)
        if planning.agronome_id != agronome.id:
            raise ConseilAccessDeniedError()
    return PlanningCulturalResponse.model_validate(planning)


async def modifier_planning(
    planning_id: uuid.UUID,
    data: PlanningCulturalUpdate,
    user: User,
    db: AsyncSession,
) -> PlanningCulturalResponse:
    result = await db.execute(
        select(PlanningCultural)
        .options(selectinload(PlanningCultural.operations))
        .where(PlanningCultural.id == planning_id)
    )
    planning = result.scalar_one_or_none()
    if not planning:
        raise PlanningNotFoundError()
    if planning.agriculteur_id != user.id and not user.has_role(UserRole.ADMIN):
        agronome = await _get_mon_agronome(user=user, db=db)
        if planning.agronome_id != agronome.id:
            raise ConseilAccessDeniedError()

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(planning, key, value)
    await db.flush()
    return PlanningCulturalResponse.model_validate(planning)
