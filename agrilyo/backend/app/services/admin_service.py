"""
Service Admin AGRILYO — requêtes transversales pour le back-office web.
Agrégations en lecture (listes, KPIs) + actions de modération qui ne relèvent
d'aucun module métier en particulier (statut de compte utilisateur). La
validation des profils Agronome/Fournisseur reste dans leurs services
respectifs (matching_service.py / semences_service.py) — voir admin.py
pour l'orchestration fine (garde EN_ATTENTE, etc.).
"""

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conseil import Agronome, DemandeConseil, StatutAgronome
from app.models.foncier import AnnonceFonciere, LitigeFoncier, StatutAnnonce, StatutLitige
from app.models.semences import FournisseurSemences, StatutFournisseur
from app.models.user import User, UserRole, UserStatus
from app.schemas.admin import (
    KPIResponse,
    UserAdminListResponse,
    UserAdminResume,
    UserStatusUpdateRequest,
)
from app.schemas.conseil import AgronomeListResponse, AgronomeResume
from app.schemas.semences import FournisseurListResponse, FournisseurResume
from app.utils.pagination import compute_total_pages

logger = logging.getLogger(__name__)


class AdminError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


async def lister_agronomes_par_statut(
    db: AsyncSession,
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
) -> AgronomeListResponse:
    """
    [Admin] Liste les agronomes par statut (par défaut EN_ATTENTE) — file de
    validation, contrairement à l'endpoint public qui ne montre que VERIFIE.
    """
    query = select(Agronome)
    if statut:
        query = query.where(Agronome.statut == statut)
    else:
        query = query.where(Agronome.statut == StatutAgronome.EN_ATTENTE)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    result = await db.execute(
        query.order_by(Agronome.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    items = result.scalars().all()
    return AgronomeListResponse(
        items=[AgronomeResume.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=compute_total_pages(total, size),
    )


async def lister_fournisseurs_par_statut(
    db: AsyncSession,
    statut: str | None = None,
    page: int = 1,
    size: int = 20,
) -> FournisseurListResponse:
    """[Admin] Liste les fournisseurs par statut (par défaut EN_ATTENTE) — file de validation."""
    query = select(FournisseurSemences)
    if statut:
        query = query.where(FournisseurSemences.statut == statut)
    else:
        query = query.where(FournisseurSemences.statut == StatutFournisseur.EN_ATTENTE)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    result = await db.execute(
        query.order_by(FournisseurSemences.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    items = result.scalars().all()
    return FournisseurListResponse(
        items=[FournisseurResume.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=compute_total_pages(total, size),
    )


async def lister_users(
    db: AsyncSession,
    role: str | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    size: int = 20,
) -> UserAdminListResponse:
    """[Admin] Liste paginée des utilisateurs, filtrable par rôle/statut/recherche téléphone."""
    query = select(User)
    if role:
        query = query.where(User.roles.contains([role]))
    if status:
        query = query.where(User.status == status)
    if search:
        query = query.where(User.phone_number.ilike(f"%{search}%"))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    result = await db.execute(
        query.order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    users = result.scalars().all()

    return UserAdminListResponse(
        items=[UserAdminResume.model_validate(u) for u in users],
        total=total,
        page=page,
        size=size,
        pages=compute_total_pages(total, size),
    )


async def get_kpis(db: AsyncSession) -> KPIResponse:
    """[Admin] Chiffres clés pour le tableau de bord — une requête légère par métrique."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()

    users_par_role: dict[str, int] = {}
    for role in UserRole:
        count = (
            await db.execute(
                select(func.count(User.id)).where(User.roles.contains([role.value]))
            )
        ).scalar_one()
        users_par_role[role.value] = count

    agronomes_en_attente = (
        await db.execute(
            select(func.count(Agronome.id)).where(Agronome.statut == StatutAgronome.EN_ATTENTE)
        )
    ).scalar_one()
    agronomes_verifies = (
        await db.execute(
            select(func.count(Agronome.id)).where(Agronome.statut == StatutAgronome.VERIFIE)
        )
    ).scalar_one()

    fournisseurs_en_attente = (
        await db.execute(
            select(func.count(FournisseurSemences.id)).where(
                FournisseurSemences.statut == StatutFournisseur.EN_ATTENTE
            )
        )
    ).scalar_one()
    fournisseurs_verifies = (
        await db.execute(
            select(func.count(FournisseurSemences.id)).where(
                FournisseurSemences.statut != StatutFournisseur.EN_ATTENTE
            )
        )
    ).scalar_one()

    annonces_actives = (
        await db.execute(
            select(func.count(AnnonceFonciere.id)).where(
                AnnonceFonciere.statut == StatutAnnonce.ACTIVE
            )
        )
    ).scalar_one()

    litiges_ouverts = (
        await db.execute(
            select(func.count(LitigeFoncier.id)).where(
                LitigeFoncier.statut.in_([StatutLitige.OUVERT, StatutLitige.MEDIATION])
            )
        )
    ).scalar_one()

    demandes_conseil_par_statut: dict[str, int] = {}
    result = await db.execute(
        select(DemandeConseil.statut, func.count(DemandeConseil.id)).group_by(
            DemandeConseil.statut
        )
    )
    for statut, count in result.all():
        demandes_conseil_par_statut[statut.value] = count

    return KPIResponse(
        total_users=total_users,
        users_par_role=users_par_role,
        agronomes_en_attente=agronomes_en_attente,
        agronomes_verifies=agronomes_verifies,
        fournisseurs_en_attente=fournisseurs_en_attente,
        fournisseurs_verifies=fournisseurs_verifies,
        annonces_actives=annonces_actives,
        litiges_ouverts=litiges_ouverts,
        demandes_conseil_par_statut=demandes_conseil_par_statut,
    )


async def mettre_a_jour_statut_user(
    db: AsyncSession,
    user_id,
    data: UserStatusUpdateRequest,
    admin: User,
) -> UserAdminResume:
    """
    [Admin] Suspend ou réactive un compte — jamais de suppression hard,
    jamais de bannissement via cette route (voir UserStatusUpdateRequest).
    """
    if str(user_id) == str(admin.id):
        raise AdminError("Vous ne pouvez pas modifier le statut de votre propre compte.", 400)

    target = await db.get(User, user_id)
    if not target:
        raise AdminError("Utilisateur introuvable", 404)

    target.status = UserStatus(data.status)
    await db.commit()
    await db.refresh(target)

    logger.info(
        "Statut utilisateur modifié par admin %s : %s -> %s (motif: %s)",
        admin.phone_number, target.phone_number, data.status, data.motif or "—",
    )
    return UserAdminResume.model_validate(target)