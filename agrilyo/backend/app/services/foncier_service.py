"""
Service Foncier AGRILYO — Logique métier M1 (corrigé)
"""

import uuid
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.foncier import (
    AnnonceFonciere,
    BadgeSecurite,
    DocumentFoncier,
    StatutAnnonce,
)
from app.models.user import User
from app.schemas.foncier import (
    AnnonceFiltres,
    AnnonceCreate,
    AnnonceListResponse,
    AnnonceResume,
    AnnonceResponse,
    AnnonceUpdate,
    BadgeUpdate,
)

class AnnonceNotFoundError(Exception):
    pass

class AnnonceAccessDeniedError(Exception):
    pass

async def creer_annonce(
    data: AnnonceCreate,
    bailleur: User,
    db: AsyncSession,
) -> AnnonceFonciere:
    annonce = AnnonceFonciere(
        bailleur_id=bailleur.id,
        type_acces=data.type_acces,
        superficie_ha=data.superficie_ha,
        prix_indicatif=data.prix_indicatif,
        region=data.region,
        sous_prefecture=data.sous_prefecture,
        village=data.village,
        latitude=data.latitude,
        longitude=data.longitude,
        statut_juridique=data.statut_juridique,
        description=data.description,
        culture_anterieure=data.culture_anterieure,
        equipements=data.equipements,
        statut=StatutAnnonce.EN_ATTENTE,
        badge=BadgeSecurite.NON_VERIFIE,
    )
    db.add(annonce)
    await db.commit()  # ✅
    await db.refresh(annonce)
    return annonce

async def get_annonce_by_id(
    annonce_id: uuid.UUID,
    db: AsyncSession,
) -> AnnonceFonciere:
    result = await db.execute(
        select(AnnonceFonciere)
        .options(
            selectinload(AnnonceFonciere.bailleur),
            selectinload(AnnonceFonciere.documents),
        )
        .where(AnnonceFonciere.id == annonce_id)
        .execution_options(populate_existing=True)
    )
    annonce = result.scalar_one_or_none()
    if not annonce:
        raise AnnonceNotFoundError(f"Annonce {annonce_id} introuvable")

    annonce.vues += 1
    await db.commit()  # ✅ Persiste l'incrémentation des vues
    return annonce

async def lister_annonces(
    filtres: AnnonceFiltres,
    db: AsyncSession,
    statuts_visibles: List[StatutAnnonce] | None = None,
    bailleur_id: uuid.UUID | None = None,  # ✅ Nouveau paramètre
) -> AnnonceListResponse:
    if statuts_visibles is None:
        statuts_visibles = [StatutAnnonce.ACTIVE]

    query = (
        select(AnnonceFonciere)
        .options(
            selectinload(AnnonceFonciere.bailleur),
            selectinload(AnnonceFonciere.documents),
        )
        .where(AnnonceFonciere.statut.in_(statuts_visibles))
        .order_by(AnnonceFonciere.created_at.desc())
    )

    # ✅ Filtre par bailleur si fourni
    if bailleur_id is not None:
        query = query.where(AnnonceFonciere.bailleur_id == bailleur_id)

    if filtres.region:
        query = query.where(AnnonceFonciere.region.ilike(f"%{filtres.region}%"))
    if filtres.type_acces:
        query = query.where(AnnonceFonciere.type_acces == filtres.type_acces)
    if filtres.badge:
        query = query.where(AnnonceFonciere.badge == filtres.badge)
    if filtres.statut_juridique:
        query = query.where(AnnonceFonciere.statut_juridique == filtres.statut_juridique)
    if filtres.superficie_min is not None:
        query = query.where(AnnonceFonciere.superficie_ha >= filtres.superficie_min)
    if filtres.superficie_max is not None:
        query = query.where(AnnonceFonciere.superficie_ha <= filtres.superficie_max)
    if filtres.prix_max is not None:
        query = query.where(
            (AnnonceFonciere.prix_indicatif == None)
            | (AnnonceFonciere.prix_indicatif <= filtres.prix_max)
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (filtres.page - 1) * filtres.size
    query = query.offset(offset).limit(filtres.size)

    result = await db.execute(query)
    annonces = result.scalars().all()

    items = []
    for a in annonces:
        photo_url = next(
            (d.url_stockage for d in a.documents
             if d.type_document == "PHOTO" and d.est_public),
            None,
        )
        resume = AnnonceResume(
            id=a.id,
            type_acces=a.type_acces,
            superficie_ha=a.superficie_ha,
            prix_indicatif=a.prix_indicatif,
            region=a.region,
            sous_prefecture=a.sous_prefecture,
            badge=a.badge,
            statut_juridique=a.statut_juridique,
            statut=a.statut,
            vues=a.vues,
            created_at=a.created_at,
            photo_url=photo_url,
        )
        items.append(resume)

    pages = max(1, -(-total // filtres.size))

    return AnnonceListResponse(
        items=items,
        total=total,
        page=filtres.page,
        size=filtres.size,
        pages=pages,
    )

async def modifier_annonce(
    annonce_id: uuid.UUID,
    data: AnnonceUpdate,
    user: User,
    db: AsyncSession,
) -> AnnonceFonciere:
    result = await db.execute(
        select(AnnonceFonciere).where(AnnonceFonciere.id == annonce_id)
    )
    annonce = result.scalar_one_or_none()
    if not annonce:
        raise AnnonceNotFoundError(f"Annonce {annonce_id} introuvable")
    if annonce.bailleur_id != user.id:
        raise AnnonceAccessDeniedError("Seul le bailleur peut modifier cette annonce")

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(annonce, field, value)

    await db.commit()  # ✅
    await db.refresh(annonce)
    return annonce

async def mettre_a_jour_badge(
    annonce_id: uuid.UUID,
    data: BadgeUpdate,
    db: AsyncSession,
) -> AnnonceFonciere:
    result = await db.execute(
        select(AnnonceFonciere)
        .options(
            selectinload(AnnonceFonciere.bailleur),
            selectinload(AnnonceFonciere.documents),
        )
        .where(AnnonceFonciere.id == annonce_id)
    )
    annonce = result.scalar_one_or_none()
    if not annonce:
        raise AnnonceNotFoundError(f"Annonce {annonce_id} introuvable")

    annonce.badge = data.badge
    annonce.badge_note = data.note

    if data.badge != BadgeSecurite.NON_VERIFIE:
        annonce.statut = StatutAnnonce.ACTIVE

    await db.commit()  # ✅
    await db.refresh(annonce)
    return annonce

async def ajouter_document(
    annonce_id: uuid.UUID,
    type_document: str,
    nom_fichier: str,
    url_stockage: str,
    taille_bytes: int | None,
    est_public: bool,
    user: User,
    db: AsyncSession,
) -> DocumentFoncier:
    result = await db.execute(
        select(AnnonceFonciere).where(AnnonceFonciere.id == annonce_id)
    )
    annonce = result.scalar_one_or_none()
    if not annonce:
        raise AnnonceNotFoundError(f"Annonce {annonce_id} introuvable")
    if annonce.bailleur_id != user.id:
        raise AnnonceAccessDeniedError("Seul le bailleur peut ajouter des documents")

    document = DocumentFoncier(
        annonce_id=annonce_id,
        type_document=type_document,
        nom_fichier=nom_fichier,
        url_stockage=url_stockage,
        taille_bytes=taille_bytes,
        est_public=est_public,
    )
    db.add(document)
    await db.commit()  # ✅
    await db.refresh(document)
    return document

async def mes_annonces(
    user: User,
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
) -> AnnonceListResponse:
    """
    ✅ CORRIGÉ : retourne uniquement les annonces du bailleur connecté.
    """
    filtres = AnnonceFiltres(page=page, size=size)
    return await lister_annonces(
        filtres=filtres,
        db=db,
        statuts_visibles=list(StatutAnnonce),
        bailleur_id=user.id,  # ✅ Filtre appliqué
    )