"""
Service Semences AGRILYO - Logique metier M2.
Catalogue fournisseurs, produits, certifications, photos, avis et Label Ivoire.
"""

import secrets
import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import and_, delete, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.semences import (
    AvisProduit,
    CertificationProduit,
    CommandeSemences,
    FournisseurSemences,
    LigneCommandeSemences,
    NiveauLabel,
    PanierItemSemences,
    PhotoProduit,
    ProduitSemences,
    StatutCommandeSemences,
    StatutFournisseur,
    StatutProduit,
    TypeCertification,
)
from app.models.user import User, UserRole
from app.services.notification_service import (
    notifier_commande_confirmee,
    notifier_statut_commande,
)
from app.schemas.semences import (
    AvisCreate,
    AvisProduitSchema,
    AvisListResponse,
    CertificationCreate,
    CommandeCreate,
    CommandeDetail,
    CommandeFromPanierCreate,
    CommandeListResponse,
    CommandeResponse,
    CommandeStatutUpdate,
    FournisseurCreate,
    FournisseurFiltres,
    FournisseurListResponse,
    FournisseurResume,
    FournisseurStatutUpdate,
    FournisseurUpdate,
    LabelIvoireUpdate,
    LigneCommandeCreate,
    LigneCommandeResponse,
    PanierItemCreate,
    PanierItemResponse,
    PanierItemUpdate,
    PanierResponse,
    ProduitCreate,
    ProduitFiltres,
    ProduitListResponse,
    ProduitResume,
    ProduitStatutUpdate,
    ProduitUpdate,
)


# =============================================================================
# Exceptions
# =============================================================================

class SemencesError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


class FournisseurNotFoundError(SemencesError):
    def __init__(self):
        super().__init__("Fournisseur introuvable", 404)


class FournisseurAlreadyExistsError(SemencesError):
    def __init__(self):
        super().__init__("Un profil fournisseur existe deja pour cet utilisateur", 409)


class ProduitNotFoundError(SemencesError):
    def __init__(self):
        super().__init__("Produit introuvable", 404)


class CommandeNotFoundError(SemencesError):
    def __init__(self):
        super().__init__("Commande introuvable", 404)


class PanierVideError(SemencesError):
    def __init__(self):
        super().__init__("Le panier est vide", 400)


class SemencesAccessDeniedError(SemencesError):
    def __init__(self, message: str = "Acces refuse"):
        super().__init__(message, 403)


# =============================================================================
# Helpers
# =============================================================================

async def _get_fournisseur_by_user(
    user: User,
    db: AsyncSession,
) -> FournisseurSemences:
    result = await db.execute(
        select(FournisseurSemences)
        .where(FournisseurSemences.user_id == user.id)
    )
    fournisseur = result.scalar_one_or_none()
    if not fournisseur:
        raise FournisseurNotFoundError()
    return fournisseur


async def _get_produit_for_update(
    produit_id: uuid.UUID,
    db: AsyncSession,
) -> ProduitSemences:
    result = await db.execute(
        select(ProduitSemences)
        .options(selectinload(ProduitSemences.fournisseur))
        .where(ProduitSemences.id == produit_id)
    )
    produit = result.scalar_one_or_none()
    if not produit:
        raise ProduitNotFoundError()
    return produit


def _assert_fournisseur_owner(
    fournisseur: FournisseurSemences,
    user: User,
) -> None:
    if fournisseur.user_id != user.id:
        raise SemencesAccessDeniedError(
            "Seul le fournisseur proprietaire peut effectuer cette action"
        )


def _photo_principale_url(produit: ProduitSemences) -> str | None:
    photo = next((p for p in produit.photos if p.est_principale), None)
    if photo is None and produit.photos:
        photo = produit.photos[0]
    if photo is None:
        return None
    return photo.url_miniature or photo.url_stockage


def _produit_resume(produit: ProduitSemences) -> ProduitResume:
    return ProduitResume(
        id=produit.id,
        nom=produit.nom,
        type_produit=produit.type_produit,
        variete=produit.variete,
        culture=produit.culture,
        prix_unitaire=produit.prix_unitaire,
        unite_stock=produit.unite_stock,
        stock_disponible=produit.stock_disponible,
        statut=produit.statut,
        note_moyenne=produit.note_moyenne,
        nombre_avis=produit.nombre_avis,
        photo_principale_url=_photo_principale_url(produit),
        fournisseur=FournisseurResume.model_validate(produit.fournisseur),
        created_at=produit.created_at,
    )


def _panier_response(items: list[PanierItemSemences]) -> PanierResponse:
    total = sum(item.quantite * item.produit.prix_unitaire for item in items)
    return PanierResponse(
        items=[
            PanierItemResponse(
                id=item.id,
                produit_id=item.produit_id,
                quantite=item.quantite,
                created_at=item.created_at,
                updated_at=item.updated_at,
                produit=_produit_resume(item.produit),
            )
            for item in items
        ],
        total_estime=total,
        nombre_items=len(items),
    )


def _commande_resume(commande: CommandeSemences):
    from app.schemas.semences import CommandeResume

    return CommandeResume(
        id=commande.id,
        reference=commande.reference,
        statut=commande.statut,
        devise=commande.devise,
        montant_total=commande.montant_total,
        nombre_lignes=commande.nombre_lignes,
        paid_at=commande.paid_at,
        cancelled_at=commande.cancelled_at,
        created_at=commande.created_at,
        updated_at=commande.updated_at,
    )


def _ligne_commande_response(ligne: LigneCommandeSemences) -> LigneCommandeResponse:
    return LigneCommandeResponse.model_validate(ligne)


def _commande_response(commande: CommandeSemences) -> CommandeResponse:
    return CommandeResponse(
        **_commande_resume(commande).model_dump(),
        acheteur_id=commande.acheteur_id,
        nom_contact=commande.nom_contact,
        telephone_contact=commande.telephone_contact,
        region_livraison=commande.region_livraison,
        ville_livraison=commande.ville_livraison,
        adresse_livraison=commande.adresse_livraison,
        note_client=commande.note_client,
        lignes=[_ligne_commande_response(ligne) for ligne in commande.lignes],
        paiements=[],
    )


def _commande_detail(commande: CommandeSemences) -> CommandeDetail:
    return CommandeDetail(
        **_commande_resume(commande).model_dump(),
        nom_contact=commande.nom_contact,
        telephone_contact=commande.telephone_contact,
        region_livraison=commande.region_livraison,
        ville_livraison=commande.ville_livraison,
        adresse_livraison=commande.adresse_livraison,
        note_client=commande.note_client,
        lignes=[_ligne_commande_response(ligne) for ligne in commande.lignes],
        paiement_actif=None,
    )


def _reference_commande() -> str:
    return f"AGR-S5-{secrets.token_hex(4).upper()}"


def _assert_produit_commandable(produit: ProduitSemences, quantite: float) -> None:
    if produit.statut != StatutProduit.ACTIF:
        raise SemencesError(f"{produit.nom} n'est pas disponible a la commande", 400)
    if produit.fournisseur.statut != StatutFournisseur.VERIFIE:
        raise SemencesError(f"Le fournisseur de {produit.nom} n'est pas verifie", 400)
    if quantite < produit.stock_minimum_commande:
        raise SemencesError(
            f"Commande minimale pour {produit.nom}: {produit.stock_minimum_commande} {produit.unite_stock.value}",
            400,
        )
    if quantite > produit.stock_disponible:
        raise SemencesError(
            f"Stock insuffisant pour {produit.nom}: {produit.stock_disponible} {produit.unite_stock.value} disponible",
            409,
        )


async def _get_produit_commandable(
    produit_id: uuid.UUID,
    quantite: float,
    db: AsyncSession,
) -> ProduitSemences:
    result = await db.execute(
        select(ProduitSemences)
        .options(
            selectinload(ProduitSemences.fournisseur),
            selectinload(ProduitSemences.photos),
        )
        .where(ProduitSemences.id == produit_id)
    )
    produit = result.scalar_one_or_none()
    if not produit:
        raise ProduitNotFoundError()
    _assert_produit_commandable(produit, quantite)
    return produit


async def _charger_panier(user: User, db: AsyncSession) -> list[PanierItemSemences]:
    result = await db.execute(
        select(PanierItemSemences)
        .options(
            selectinload(PanierItemSemences.produit).selectinload(ProduitSemences.fournisseur),
            selectinload(PanierItemSemences.produit).selectinload(ProduitSemences.photos),
        )
        .where(PanierItemSemences.user_id == user.id)
        .order_by(PanierItemSemences.created_at.asc())
    )
    return list(result.scalars().all())


async def _charger_commande(
    commande_id: uuid.UUID,
    db: AsyncSession,
) -> CommandeSemences:
    result = await db.execute(
        select(CommandeSemences)
        .options(
            selectinload(CommandeSemences.acheteur),
            selectinload(CommandeSemences.lignes),
        )
        .where(CommandeSemences.id == commande_id)
    )
    commande = result.scalar_one_or_none()
    if not commande:
        raise CommandeNotFoundError()
    return commande


def _lignes_depuis_produits(
    commande: CommandeSemences,
    lignes: list[tuple[ProduitSemences, float]],
) -> None:
    montant_total = 0.0
    for produit, quantite in lignes:
        montant_ligne = quantite * produit.prix_unitaire
        montant_total += montant_ligne
        commande.lignes.append(
            LigneCommandeSemences(
                produit_id=produit.id,
                fournisseur_id=produit.fournisseur_id,
                quantite=quantite,
                prix_unitaire_snapshot=produit.prix_unitaire,
                montant_ligne=montant_ligne,
                produit_nom_snapshot=produit.nom,
                produit_variete_snapshot=produit.variete,
                culture_snapshot=produit.culture,
                unite_stock_snapshot=produit.unite_stock,
                fournisseur_nom_snapshot=produit.fournisseur.nom_commercial,
            )
        )
        produit.stock_disponible -= quantite
        produit.statut = _statut_produit_selon_stock(produit)

    commande.montant_total = montant_total
    commande.nombre_lignes = len(lignes)


async def recalculer_stats_fournisseur(
    fournisseur_id: uuid.UUID,
    db: AsyncSession,
) -> FournisseurSemences:
    fournisseur = await db.get(FournisseurSemences, fournisseur_id)
    if not fournisseur:
        raise FournisseurNotFoundError()

    produits_actifs_result = await db.execute(
        select(func.count())
        .select_from(ProduitSemences)
        .where(
            ProduitSemences.fournisseur_id == fournisseur_id,
            ProduitSemences.statut == StatutProduit.ACTIF,
        )
    )
    fournisseur.nombre_produits_actifs = produits_actifs_result.scalar_one()

    avis_stats_result = await db.execute(
        select(func.avg(AvisProduit.note), func.count(AvisProduit.id))
        .select_from(AvisProduit)
        .join(ProduitSemences, AvisProduit.produit_id == ProduitSemences.id)
        .where(
            ProduitSemences.fournisseur_id == fournisseur_id,
            AvisProduit.est_publie == True,
        )
    )
    moyenne, total = avis_stats_result.one()
    fournisseur.note_moyenne = round(float(moyenne or 0), 2)
    fournisseur.nombre_avis = total
    return fournisseur


async def recalculer_stats_produit(
    produit_id: uuid.UUID,
    db: AsyncSession,
) -> ProduitSemences:
    produit = await db.get(ProduitSemences, produit_id)
    if not produit:
        raise ProduitNotFoundError()

    avis_stats_result = await db.execute(
        select(func.avg(AvisProduit.note), func.count(AvisProduit.id))
        .where(
            AvisProduit.produit_id == produit_id,
            AvisProduit.est_publie == True,
        )
    )
    moyenne, total = avis_stats_result.one()
    produit.note_moyenne = round(float(moyenne or 0), 2)
    produit.nombre_avis = total
    return produit


def _statut_produit_selon_stock(produit: ProduitSemences) -> StatutProduit:
    if produit.stock_disponible <= 0:
        return StatutProduit.RUPTURE
    return StatutProduit.ACTIF


# =============================================================================
# Fournisseurs
# =============================================================================

async def creer_fournisseur(
    data: FournisseurCreate,
    user: User,
    db: AsyncSession,
) -> FournisseurSemences:
    existing = await db.execute(
        select(FournisseurSemences.id)
        .where(FournisseurSemences.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise FournisseurAlreadyExistsError()

    if not user.has_role(UserRole.SEMENCIER):
        user.add_role(UserRole.SEMENCIER)

    fournisseur = FournisseurSemences(
        user_id=user.id,
        nom_commercial=data.nom_commercial,
        description=data.description,
        region=data.region,
        ville=data.ville,
        adresse_complete=data.adresse_complete,
        latitude=data.latitude,
        longitude=data.longitude,
        telephone_pro=data.telephone_pro,
        email_pro=data.email_pro,
        site_web=data.site_web,
        statut=StatutFournisseur.EN_ATTENTE,
    )
    db.add(fournisseur)
    await db.commit()
    await db.flush()
    await db.refresh(fournisseur)
    return fournisseur


async def get_fournisseur_by_id(
    fournisseur_id: uuid.UUID,
    db: AsyncSession,
) -> FournisseurSemences:
    result = await db.execute(
        select(FournisseurSemences)
        .options(selectinload(FournisseurSemences.user))
        .where(FournisseurSemences.id == fournisseur_id)
    )
    fournisseur = result.scalar_one_or_none()
    if not fournisseur:
        raise FournisseurNotFoundError()
    return fournisseur


async def get_mon_fournisseur(
    user: User,
    db: AsyncSession,
) -> FournisseurSemences:
    return await _get_fournisseur_by_user(user=user, db=db)


async def lister_fournisseurs(
    filtres: FournisseurFiltres,
    db: AsyncSession,
    statuts_visibles: List[StatutFournisseur] | None = None,
) -> FournisseurListResponse:
    if statuts_visibles is None:
        statuts_visibles = [StatutFournisseur.VERIFIE]

    query = (
        select(FournisseurSemences)
        .where(FournisseurSemences.statut.in_(statuts_visibles))
    )

    if filtres.region:
        query = query.where(FournisseurSemences.region.ilike(f"%{filtres.region}%"))
    if filtres.label_ivoire:
        query = query.where(FournisseurSemences.label_ivoire == filtres.label_ivoire)
    if filtres.note_min is not None:
        query = query.where(FournisseurSemences.note_moyenne >= filtres.note_min)
    if filtres.culture:
        query = query.where(
            exists().where(
                and_(
                    ProduitSemences.fournisseur_id == FournisseurSemences.id,
                    ProduitSemences.culture.ilike(f"%{filtres.culture.strip().lower()}%"),
                    ProduitSemences.statut == StatutProduit.ACTIF,
                )
            )
        )

    if filtres.tri == "created_at_desc":
        query = query.order_by(FournisseurSemences.created_at.desc())
    elif filtres.tri == "nombre_produits_desc":
        query = query.order_by(FournisseurSemences.nombre_produits_actifs.desc())
    else:
        query = query.order_by(
            FournisseurSemences.note_moyenne.desc(),
            FournisseurSemences.nombre_avis.desc(),
        )

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    offset = (filtres.page - 1) * filtres.size
    result = await db.execute(query.offset(offset).limit(filtres.size))
    fournisseurs = result.scalars().all()

    pages = max(1, -(-total // filtres.size))
    return FournisseurListResponse(
        items=[FournisseurResume.model_validate(f) for f in fournisseurs],
        total=total,
        page=filtres.page,
        size=filtres.size,
        pages=pages,
    )


async def modifier_fournisseur(
    data: FournisseurUpdate,
    user: User,
    db: AsyncSession,
) -> FournisseurSemences:
    fournisseur = await _get_fournisseur_by_user(user=user, db=db)
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(fournisseur, field, value)
    await db.commit()  # ✅
    await db.refresh(fournisseur)  # ✅

    return fournisseur


async def mettre_a_jour_statut_fournisseur(
    fournisseur_id: uuid.UUID,
    data: FournisseurStatutUpdate,
    db: AsyncSession,
) -> FournisseurSemences:
    fournisseur = await get_fournisseur_by_id(fournisseur_id=fournisseur_id, db=db)
    fournisseur.statut = data.statut
    fournisseur.note_admin = data.note_admin

    if data.statut == StatutFournisseur.VERIFIE:
        fournisseur.verifie_le = datetime.now(timezone.utc)
        if fournisseur.label_ivoire is None:
            fournisseur.label_ivoire = NiveauLabel.BRONZE
            fournisseur.label_attribue_le = datetime.now(timezone.utc)
    elif data.statut in (StatutFournisseur.SUSPENDU, StatutFournisseur.REJETE):
        fournisseur.label_ivoire = None
        fournisseur.label_attribue_le = None
        fournisseur.label_expire_le = None
    await db.commit()  # ✅
    await db.refresh(fournisseur)  # ✅
    return fournisseur


async def mettre_a_jour_label_ivoire(
    fournisseur_id: uuid.UUID,
    data: LabelIvoireUpdate,
    db: AsyncSession,
) -> FournisseurSemences:
    fournisseur = await get_fournisseur_by_id(fournisseur_id=fournisseur_id, db=db)

    if data.label_ivoire is not None and fournisseur.statut != StatutFournisseur.VERIFIE:
        raise SemencesError(
            "Le Label Ivoire Semences exige un fournisseur verifie",
            400,
        )

    if data.label_ivoire in (NiveauLabel.ARGENT, NiveauLabel.OR):
        has_certification = await db.execute(
            select(
                exists().where(
                    and_(
                        ProduitSemences.fournisseur_id == fournisseur_id,
                        CertificationProduit.produit_id == ProduitSemences.id,
                        CertificationProduit.est_verifie == True,
                        CertificationProduit.type_certification.in_(
                            [
                                TypeCertification.ANADER,
                                TypeCertification.FIRCA,
                                TypeCertification.MINAGRI,
                                TypeCertification.ISO,
                                TypeCertification.BIO,
                            ]
                        ),
                    )
                )
            )
        )
        if not has_certification.scalar_one():
            raise SemencesError(
                "Le label ARGENT/OR exige au moins une certification officielle verifiee",
                400,
            )

    if data.label_ivoire == NiveauLabel.OR and (
        fournisseur.note_moyenne < 4.5 or fournisseur.nombre_avis < 5
    ):
        raise SemencesError(
            "Le label OR exige une note moyenne >= 4.5 et au moins 5 avis publies",
            400,
        )

    fournisseur.label_ivoire = data.label_ivoire
    fournisseur.label_expire_le = data.label_expire_le
    fournisseur.label_attribue_le = (
        datetime.now(timezone.utc) if data.label_ivoire is not None else None
    )
    if data.label_ivoire is None:
        fournisseur.label_expire_le = None

    await db.commit()
    await db.refresh(fournisseur)
    return fournisseur


# =============================================================================
# Produits
# =============================================================================

async def creer_produit(
    data: ProduitCreate,
    user: User,
    db: AsyncSession,
) -> ProduitSemences:
    fournisseur = await _get_fournisseur_by_user(user=user, db=db)
    if fournisseur.statut in (StatutFournisseur.SUSPENDU, StatutFournisseur.REJETE):
        raise SemencesAccessDeniedError(
            "Ce fournisseur ne peut pas publier de produits"
        )

    produit = ProduitSemences(
        fournisseur_id=fournisseur.id,
        nom=data.nom,
        type_produit=data.type_produit,
        variete=data.variete,
        culture=data.culture,
        description=data.description,
        duree_germination_jours=data.duree_germination_jours,
        rendement_potentiel=data.rendement_potentiel,
        zones_adaptation=data.zones_adaptation,
        saison_semis=data.saison_semis,
        prix_unitaire=data.prix_unitaire,
        unite_stock=data.unite_stock,
        stock_disponible=data.stock_disponible,
        stock_minimum_commande=data.stock_minimum_commande,
        statut=StatutProduit.EN_ATTENTE,
    )
    db.add(produit)
    await db.flush()
    await db.commit()
    await recalculer_stats_fournisseur(fournisseur.id, db)
    await db.refresh(produit)
    return produit


async def get_produit_by_id(
    produit_id: uuid.UUID,
    db: AsyncSession,
    incrementer_vues: bool = True,
) -> ProduitSemences:
    result = await db.execute(
        select(ProduitSemences)
        .options(
            selectinload(ProduitSemences.fournisseur),
            selectinload(ProduitSemences.photos),
            selectinload(ProduitSemences.certifications),
            selectinload(
                ProduitSemences.avis.and_(AvisProduit.est_publie == True)
            ).selectinload(AvisProduit.auteur),
        )
        .where(ProduitSemences.id == produit_id)
    )
    produit = result.scalar_one_or_none()
    if not produit:
        raise ProduitNotFoundError()

    if incrementer_vues:
        produit.nombre_vues += 1
    return produit


async def lister_produits(
    filtres: ProduitFiltres,
    db: AsyncSession,
    statuts_visibles: List[StatutProduit] | None = None,
) -> ProduitListResponse:
    if statuts_visibles is None:
        statuts_visibles = [StatutProduit.ACTIF, StatutProduit.RUPTURE]

    query = (
        select(ProduitSemences)
        .options(
            selectinload(ProduitSemences.fournisseur),
            selectinload(ProduitSemences.photos),
        )
        .join(FournisseurSemences, ProduitSemences.fournisseur_id == FournisseurSemences.id)
        .where(
            ProduitSemences.statut.in_(statuts_visibles),
            FournisseurSemences.statut == StatutFournisseur.VERIFIE,
        )
    )

    if filtres.culture:
        query = query.where(ProduitSemences.culture.ilike(f"%{filtres.culture.strip().lower()}%"))
    if filtres.type_produit:
        query = query.where(ProduitSemences.type_produit == filtres.type_produit)
    if filtres.region:
        query = query.where(FournisseurSemences.region.ilike(f"%{filtres.region}%"))
    if filtres.prix_min is not None:
        query = query.where(ProduitSemences.prix_unitaire >= filtres.prix_min)
    if filtres.prix_max is not None:
        query = query.where(ProduitSemences.prix_unitaire <= filtres.prix_max)
    if filtres.label_ivoire:
        query = query.where(FournisseurSemences.label_ivoire == filtres.label_ivoire)
    if filtres.en_stock is True:
        query = query.where(ProduitSemences.stock_disponible > 0)
    elif filtres.en_stock is False:
        query = query.where(ProduitSemences.stock_disponible <= 0)
    if filtres.certifie is not None:
        certification_exists = exists().where(
            and_(
                CertificationProduit.produit_id == ProduitSemences.id,
                CertificationProduit.est_verifie == True,
            )
        )
        query = query.where(certification_exists if filtres.certifie else ~certification_exists)

    if filtres.tri == "prix_asc":
        query = query.order_by(ProduitSemences.prix_unitaire.asc())
    elif filtres.tri == "prix_desc":
        query = query.order_by(ProduitSemences.prix_unitaire.desc())
    elif filtres.tri == "note_desc":
        query = query.order_by(
            ProduitSemences.note_moyenne.desc(),
            ProduitSemences.nombre_avis.desc(),
        )
    else:
        query = query.order_by(ProduitSemences.created_at.desc())

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    offset = (filtres.page - 1) * filtres.size
    result = await db.execute(query.offset(offset).limit(filtres.size))
    produits = result.scalars().all()

    pages = max(1, -(-total // filtres.size))
    return ProduitListResponse(
        items=[_produit_resume(produit) for produit in produits],
        total=total,
        page=filtres.page,
        size=filtres.size,
        pages=pages,
    )


async def modifier_produit(
    produit_id: uuid.UUID,
    data: ProduitUpdate,
    user: User,
    db: AsyncSession,
) -> ProduitSemences:
    produit = await _get_produit_for_update(produit_id=produit_id, db=db)
    _assert_fournisseur_owner(produit.fournisseur, user)

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(produit, field, value)

    if "stock_disponible" in update_data and "statut" not in update_data:
        produit.statut = _statut_produit_selon_stock(produit)

    await recalculer_stats_fournisseur(produit.fournisseur_id, db)
    await db.commit()
    await db.refresh(produit)
    return produit


async def mettre_a_jour_statut_produit(
    produit_id: uuid.UUID,
    data: ProduitStatutUpdate,
    db: AsyncSession,
) -> ProduitSemences:
    produit = await _get_produit_for_update(produit_id=produit_id, db=db)
    produit.statut = data.statut
    await recalculer_stats_fournisseur(produit.fournisseur_id, db)
    return produit


async def mes_produits(
    user: User,
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
) -> ProduitListResponse:
    fournisseur = await _get_fournisseur_by_user(user=user, db=db)
    filtres = ProduitFiltres(page=page, size=size)

    query = (
        select(ProduitSemences)
        .options(
            selectinload(ProduitSemences.fournisseur),
            selectinload(ProduitSemences.photos),
        )
        .where(ProduitSemences.fournisseur_id == fournisseur.id)
        .order_by(ProduitSemences.created_at.desc())
    )

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    result = await db.execute(query.offset((page - 1) * size).limit(size))
    produits = result.scalars().all()

    pages = max(1, -(-total // size))
    return ProduitListResponse(
        items=[_produit_resume(produit) for produit in produits],
        total=total,
        page=filtres.page,
        size=filtres.size,
        pages=pages,
    )


# =============================================================================
# Photos, certifications et avis
# =============================================================================

async def ajouter_photo_produit(
    produit_id: uuid.UUID,
    nom_fichier: str,
    url_stockage: str,
    url_miniature: str | None,
    taille_bytes: int | None,
    ordre: int,
    est_principale: bool,
    user: User,
    db: AsyncSession,
) -> PhotoProduit:
    produit = await _get_produit_for_update(produit_id=produit_id, db=db)
    _assert_fournisseur_owner(produit.fournisseur, user)

    if est_principale:
        existing_photos = await db.execute(
            select(PhotoProduit).where(PhotoProduit.produit_id == produit_id)
        )
        for photo in existing_photos.scalars().all():
            photo.est_principale = False

    photo = PhotoProduit(
        produit_id=produit_id,
        nom_fichier=nom_fichier,
        url_stockage=url_stockage,
        url_miniature=url_miniature,
        taille_bytes=taille_bytes,
        ordre=ordre,
        est_principale=est_principale,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)
    return photo


async def ajouter_certification(
    produit_id: uuid.UUID,
    data: CertificationCreate,
    user: User,
    db: AsyncSession,
) -> CertificationProduit:
    produit = await _get_produit_for_update(produit_id=produit_id, db=db)
    _assert_fournisseur_owner(produit.fournisseur, user)

    certification = CertificationProduit(
        produit_id=produit_id,
        type_certification=data.type_certification,
        numero_certificat=data.numero_certificat,
        organisme_delivreur=data.organisme_delivreur,
        date_delivrance=data.date_delivrance,
        date_expiration=data.date_expiration,
        est_verifie=False,
    )
    db.add(certification)
    await db.commit()
    await db.flush()
    await db.refresh(certification)
    return certification


async def verifier_certification(
    certification_id: uuid.UUID,
    est_verifie: bool,
    db: AsyncSession,
) -> CertificationProduit:
    certification = await db.get(CertificationProduit, certification_id)
    if not certification:
        raise SemencesError("Certification introuvable", 404)
    certification.est_verifie = est_verifie
    return certification


async def ajouter_avis(
    produit_id: uuid.UUID,
    data: AvisCreate,
    auteur: User,
    db: AsyncSession,
) -> AvisProduit:
    produit = await _get_produit_for_update(produit_id=produit_id, db=db)
    if produit.fournisseur.user_id == auteur.id:
        raise SemencesError("Un fournisseur ne peut pas noter son propre produit", 400)

    existing = await db.execute(
        select(AvisProduit.id).where(
            AvisProduit.produit_id == produit_id,
            AvisProduit.auteur_id == auteur.id,
        )
    )
    if existing.scalar_one_or_none():
        raise SemencesError("Vous avez deja laisse un avis sur ce produit", 409)

    avis = AvisProduit(
        produit_id=produit_id,
        auteur_id=auteur.id,
        note=data.note,
        commentaire=data.commentaire,
        est_publie=True,
        est_verifie_achat=False,
    )
    db.add(avis)
    await db.flush()
    await recalculer_stats_produit(produit_id, db)
    await recalculer_stats_fournisseur(produit.fournisseur_id, db)
    await db.commit()
    await db.refresh(avis)

    result = await db.execute(
        select(AvisProduit)
        .options(selectinload(AvisProduit.auteur))
        .where(AvisProduit.id == avis.id)
    )
    avis_charge = result.scalar_one()
    return avis_charge


async def lister_avis_produit(
    produit_id: uuid.UUID,
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
) -> AvisListResponse:
    produit = await db.get(ProduitSemences, produit_id)
    if not produit:
        raise ProduitNotFoundError()

    query = (
        select(AvisProduit)
        .options(selectinload(AvisProduit.auteur))
        .where(
            AvisProduit.produit_id == produit_id,
            AvisProduit.est_publie == True,
        )
        .order_by(AvisProduit.created_at.desc())
    )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * size).limit(size))
    avis = result.scalars().all()

    pages = max(1, -(-total // size))
    return AvisListResponse(
        items=[AvisProduitSchema.from_orm(item) for item in avis],
        total=total,
        note_moyenne=produit.note_moyenne,
        page=page,
        size=size,
        pages=pages,
    )


# =============================================================================
# Panier persistant & commandes sans paiement
# =============================================================================

async def get_panier(
    user: User,
    db: AsyncSession,
) -> PanierResponse:
    items = await _charger_panier(user=user, db=db)
    return _panier_response(items)


async def ajouter_item_panier(
    data: PanierItemCreate,
    user: User,
    db: AsyncSession,
) -> PanierResponse:
    produit = await _get_produit_commandable(
        produit_id=data.produit_id,
        quantite=data.quantite,
        db=db,
    )

    result = await db.execute(
        select(PanierItemSemences).where(
            PanierItemSemences.user_id == user.id,
            PanierItemSemences.produit_id == produit.id,
        )
    )
    item = result.scalar_one_or_none()
    if item:
        item.quantite = data.quantite
    else:
        db.add(
            PanierItemSemences(
                user_id=user.id,
                produit_id=produit.id,
                quantite=data.quantite,
            )
        )

    await db.flush()
    return await get_panier(user=user, db=db)


async def modifier_item_panier(
    produit_id: uuid.UUID,
    data: PanierItemUpdate,
    user: User,
    db: AsyncSession,
) -> PanierResponse:
    await _get_produit_commandable(
        produit_id=produit_id,
        quantite=data.quantite,
        db=db,
    )
    result = await db.execute(
        select(PanierItemSemences).where(
            PanierItemSemences.user_id == user.id,
            PanierItemSemences.produit_id == produit_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise SemencesError("Ligne panier introuvable", 404)

    item.quantite = data.quantite
    await db.flush()
    return await get_panier(user=user, db=db)


async def retirer_item_panier(
    produit_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> None:
    await db.execute(
        delete(PanierItemSemences).where(
            PanierItemSemences.user_id == user.id,
            PanierItemSemences.produit_id == produit_id,
        )
    )


async def vider_panier(
    user: User,
    db: AsyncSession,
) -> None:
    await db.execute(
        delete(PanierItemSemences).where(PanierItemSemences.user_id == user.id)
    )


async def creer_commande(
    data: CommandeCreate,
    user: User,
    db: AsyncSession,
) -> CommandeResponse:
    lignes: list[tuple[ProduitSemences, float]] = []
    for ligne in data.lignes:
        produit = await _get_produit_commandable(
            produit_id=ligne.produit_id,
            quantite=ligne.quantite,
            db=db,
        )
        lignes.append((produit, ligne.quantite))

    commande = CommandeSemences(
        acheteur_id=user.id,
        reference=_reference_commande(),
        statut=StatutCommandeSemences.CONFIRMEE,
        nom_contact=data.nom_contact or user.display_name,
        telephone_contact=data.telephone_contact or user.phone_number,
        region_livraison=data.region_livraison or user.region,
        ville_livraison=data.ville_livraison,
        adresse_livraison=data.adresse_livraison,
        note_client=data.note_client,
    )
    db.add(commande)
    _lignes_depuis_produits(commande, lignes)
    await db.commit()  # ✅
    await db.flush()
    await db.refresh(commande, attribute_names=["lignes"])
    await notifier_commande_confirmee(commande=commande, acheteur=user)
    return _commande_response(commande)


async def creer_commande_depuis_panier(
    data: CommandeFromPanierCreate,
    user: User,
    db: AsyncSession,
) -> CommandeResponse:
    items = await _charger_panier(user=user, db=db)
    if not items:
        raise PanierVideError()

    lignes_data = [
        LigneCommandeCreate(produit_id=item.produit_id, quantite=item.quantite)
        for item in items
    ]
    commande = await creer_commande(
        data=CommandeCreate(
            lignes=lignes_data,
            nom_contact=data.nom_contact,
            telephone_contact=data.telephone_contact,
            region_livraison=data.region_livraison,
            ville_livraison=data.ville_livraison,
            adresse_livraison=data.adresse_livraison,
            note_client=data.note_client,
        ),
        user=user,
        db=db,
    )
    await vider_panier(user=user, db=db)
    await db.commit()  # ✅
    await db.refresh(commande)
    return commande


async def lister_commandes(
    user: User,
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
) -> CommandeListResponse:
    query = (
        select(CommandeSemences)
        .where(CommandeSemences.acheteur_id == user.id)
        .order_by(CommandeSemences.created_at.desc())
    )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * size).limit(size))
    commandes = result.scalars().all()
    pages = max(1, -(-total // size))
    return CommandeListResponse(
        items=[_commande_resume(commande) for commande in commandes],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


async def get_commande(
    commande_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> CommandeDetail:
    commande = await _charger_commande(commande_id=commande_id, db=db)
    if commande.acheteur_id != user.id and not user.has_role(UserRole.ADMIN):
        raise SemencesAccessDeniedError()
    return _commande_detail(commande)


async def mettre_a_jour_statut_commande(
    commande_id: uuid.UUID,
    data: CommandeStatutUpdate,
    user: User,
    db: AsyncSession,
) -> CommandeDetail:
    commande = await _charger_commande(commande_id=commande_id, db=db)
    if not user.has_role(UserRole.ADMIN):
        fournisseur = await _get_fournisseur_by_user(user=user, db=db)
        fournisseur_ids = {ligne.fournisseur_id for ligne in commande.lignes}
        if fournisseur.id not in fournisseur_ids:
            raise SemencesAccessDeniedError()

    transitions = {
        StatutCommandeSemences.CONFIRMEE: {
            StatutCommandeSemences.EN_PREPARATION,
            StatutCommandeSemences.ANNULEE,
        },
        StatutCommandeSemences.EN_PREPARATION: {
            StatutCommandeSemences.LIVREE,
            StatutCommandeSemences.ANNULEE,
        },
    }
    statuts_autorises = transitions.get(commande.statut, set())
    if data.statut not in statuts_autorises:
        raise SemencesError("Transition de statut non autorisee", 400)
    if data.statut == StatutCommandeSemences.ANNULEE and not user.has_role(UserRole.ADMIN):
        raise SemencesAccessDeniedError("Seul un administrateur peut annuler une commande")

    commande.statut = data.statut
    if data.statut == StatutCommandeSemences.ANNULEE:
        commande.cancelled_at = datetime.now(timezone.utc)
        for ligne in commande.lignes:
            produit = await _get_produit_for_update(produit_id=ligne.produit_id, db=db)
            produit.stock_disponible += ligne.quantite
            produit.statut = _statut_produit_selon_stock(produit)

    await db.flush()
    await notifier_statut_commande(commande=commande, acheteur=commande.acheteur)
    await db.commit()
    await db.refresh(commande)
    return _commande_detail(commande)
