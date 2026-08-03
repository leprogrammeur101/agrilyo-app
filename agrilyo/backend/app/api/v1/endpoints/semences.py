"""
Endpoints M2 Semences & Plants - AGRILYO.
Routes catalogue, fournisseurs, produits, certifications, avis et label.
"""

import uuid
from typing import NoReturn

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_authenticated_user
from app.core.database import get_db
from app.models.semences import (
    NiveauLabel,
    StatutFournisseur,
    StatutProduit,
    TypeProduit,
)
from app.models.user import User, UserRole
from app.schemas.semences import (
    AvisCreate,
    AvisListResponse,
    AvisProduitSchema,
    CertificationCreate,
    CertificationProduitSchema,
    CommandeCreate,
    CommandeDetail,
    CommandeFromPanierCreate,
    CommandeListResponse,
    CommandeResponse,
    CommandeStatutUpdate,
    FournisseurCreate,
    FournisseurFiltres,
    FournisseurListResponse,
    FournisseurResponse,
    FournisseurStatutUpdate,
    FournisseurUpdate,
    LabelIvoireUpdate,
    PanierItemCreate,
    PanierItemUpdate,
    PanierResponse,
    PhotoUploadResponse,
    ProduitCreate,
    ProduitFiltres,
    ProduitListResponse,
    ProduitResponse,
    ProduitStatutUpdate,
    ProduitUpdate,
)
from app.services.semences_service import (
    FournisseurAlreadyExistsError,
    FournisseurNotFoundError,
    ProduitNotFoundError,
    SemencesAccessDeniedError,
    SemencesError,
    ajouter_avis,
    ajouter_certification,
    ajouter_item_panier,
    ajouter_photo_produit,
    creer_commande,
    creer_commande_depuis_panier,
    creer_fournisseur,
    creer_produit,
    get_commande,
    get_fournisseur_by_id,
    get_mon_fournisseur,
    get_panier,
    get_produit_by_id,
    lister_avis_produit,
    lister_commandes,
    lister_fournisseurs,
    lister_produits,
    mes_produits,
    mettre_a_jour_statut_commande,
    mettre_a_jour_label_ivoire,
    mettre_a_jour_statut_fournisseur,
    mettre_a_jour_statut_produit,
    modifier_fournisseur,
    modifier_item_panier,
    modifier_produit,
    retirer_item_panier,
    vider_panier,
    verifier_certification,
)

router = APIRouter()


def _raise_semences_error(error: SemencesError) -> NoReturn:
    raise HTTPException(status_code=error.status_code, detail=error.message)


def _require_admin(user: User) -> None:
    if not user.has_role(UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail="Seul un administrateur peut effectuer cette action",
        )


# =============================================================================
# Panier & commandes - routes statiques avant /produits/{id}
# =============================================================================

@router.get(
    "/panier",
    response_model=PanierResponse,
    summary="Consulter le panier semences persistant",
)
async def get_panier_endpoint(
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PanierResponse:
    return await get_panier(user=current_user, db=db)


@router.post(
    "/panier/items",
    response_model=PanierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter ou remplacer une ligne du panier",
)
async def ajouter_item_panier_endpoint(
    data: PanierItemCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PanierResponse:
    try:
        return await ajouter_item_panier(data=data, user=current_user, db=db)
    except SemencesError as e:
        _raise_semences_error(e)


@router.patch(
    "/panier/items/{produit_id}",
    response_model=PanierResponse,
    summary="Modifier la quantite d'une ligne panier",
)
async def modifier_item_panier_endpoint(
    produit_id: uuid.UUID,
    data: PanierItemUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PanierResponse:
    try:
        return await modifier_item_panier(
            produit_id=produit_id,
            data=data,
            user=current_user,
            db=db,
        )
    except SemencesError as e:
        _raise_semences_error(e)


@router.delete(
    "/panier/items/{produit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Retirer une ligne du panier",
)
async def retirer_item_panier_endpoint(
    produit_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await retirer_item_panier(produit_id=produit_id, user=current_user, db=db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/panier",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Vider le panier semences",
)
async def vider_panier_endpoint(
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await vider_panier(user=current_user, db=db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/commandes",
    response_model=CommandeListResponse,
    summary="Lister mes commandes semences",
)
async def lister_commandes_endpoint(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CommandeListResponse:
    return await lister_commandes(user=current_user, db=db, page=page, size=size)


@router.post(
    "/commandes",
    response_model=CommandeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer une commande semences sans paiement",
)
async def creer_commande_endpoint(
    data: CommandeCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CommandeResponse:
    try:
        return await creer_commande(data=data, user=current_user, db=db)
    except SemencesError as e:
        _raise_semences_error(e)


@router.post(
    "/commandes/depuis-panier",
    response_model=CommandeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Transformer le panier persistant en commande",
)
async def creer_commande_depuis_panier_endpoint(
    data: CommandeFromPanierCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CommandeResponse:
    try:
        return await creer_commande_depuis_panier(data=data, user=current_user, db=db)
    except SemencesError as e:
        _raise_semences_error(e)


@router.get(
    "/commandes/{commande_id}",
    response_model=CommandeDetail,
    summary="Consulter le detail d'une commande semences",
)
async def get_commande_endpoint(
    commande_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CommandeDetail:
    try:
        return await get_commande(
            commande_id=commande_id,
            user=current_user,
            db=db,
        )
    except SemencesError as e:
        _raise_semences_error(e)


@router.patch(
    "/commandes/{commande_id}/statut",
    response_model=CommandeDetail,
    summary="Mettre a jour le statut d'une commande semences",
)
async def statut_commande_endpoint(
    commande_id: uuid.UUID,
    data: CommandeStatutUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CommandeDetail:
    try:
        return await mettre_a_jour_statut_commande(
            commande_id=commande_id,
            data=data,
            user=current_user,
            db=db,
        )
    except SemencesError as e:
        _raise_semences_error(e)


# =============================================================================
# Produits - routes statiques
# =============================================================================

@router.get(
    "/produits",
    response_model=ProduitListResponse,
    summary="Lister le catalogue de semences et plants",
)
async def lister_produits_endpoint(
    culture: str | None = Query(default=None),
    type_produit: TypeProduit | None = Query(default=None),
    region: str | None = Query(default=None),
    prix_min: float | None = Query(default=None, ge=0),
    prix_max: float | None = Query(default=None, ge=0),
    certifie: bool | None = Query(default=None),
    label_ivoire: NiveauLabel | None = Query(default=None),
    en_stock: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    tri: str | None = Query(default="created_at_desc"),
    db: AsyncSession = Depends(get_db),
) -> ProduitListResponse:
    filtres = ProduitFiltres(
        culture=culture,
        type_produit=type_produit,
        region=region,
        prix_min=prix_min,
        prix_max=prix_max,
        certifie=certifie,
        label_ivoire=label_ivoire,
        en_stock=en_stock,
        page=page,
        size=size,
        tri=tri,
    )
    return await lister_produits(filtres=filtres, db=db)


@router.post(
    "/produits",
    response_model=ProduitResponse,
    status_code=201,
    summary="Creer un produit semence/plant",
)
async def creer_produit_endpoint(
    data: ProduitCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> ProduitResponse:
    try:
        produit = await creer_produit(data=data, user=current_user, db=db)
        produit = await get_produit_by_id(produit.id, db, incrementer_vues=False)
        return ProduitResponse.model_validate(produit)
    except (FournisseurNotFoundError, SemencesAccessDeniedError, SemencesError) as e:
        _raise_semences_error(e)


@router.get(
    "/produits/mes-produits",
    response_model=ProduitListResponse,
    summary="Lister mes produits fournisseur",
)
async def mes_produits_endpoint(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> ProduitListResponse:
    try:
        return await mes_produits(user=current_user, db=db, page=page, size=size)
    except FournisseurNotFoundError as e:
        _raise_semences_error(e)


# =============================================================================
# Fournisseurs - routes statiques
# =============================================================================

@router.get(
    "/fournisseurs",
    response_model=FournisseurListResponse,
    summary="Lister les fournisseurs verifies",
)
async def lister_fournisseurs_endpoint(
    region: str | None = Query(default=None),
    label_ivoire: NiveauLabel | None = Query(default=None),
    culture: str | None = Query(default=None),
    note_min: float | None = Query(default=None, ge=0, le=5),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    tri: str | None = Query(default="note_desc"),
    db: AsyncSession = Depends(get_db),
) -> FournisseurListResponse:
    filtres = FournisseurFiltres(
        region=region,
        label_ivoire=label_ivoire,
        culture=culture,
        note_min=note_min,
        page=page,
        size=size,
        tri=tri,
    )
    return await lister_fournisseurs(filtres=filtres, db=db)


@router.post(
    "/fournisseurs",
    response_model=FournisseurResponse,
    status_code=201,
    summary="Creer mon profil fournisseur",
)
async def creer_fournisseur_endpoint(
    data: FournisseurCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    try:
        fournisseur = await creer_fournisseur(data=data, user=current_user, db=db)
        return FournisseurResponse.model_validate(fournisseur)
    except FournisseurAlreadyExistsError as e:
        _raise_semences_error(e)


@router.get(
    "/fournisseurs/moi",
    response_model=FournisseurResponse,
    summary="Recuperer mon profil fournisseur",
)
async def mon_fournisseur_endpoint(
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    try:
        fournisseur = await get_mon_fournisseur(user=current_user, db=db)
        return FournisseurResponse.model_validate(fournisseur)
    except FournisseurNotFoundError as e:
        _raise_semences_error(e)


@router.patch(
    "/fournisseurs/moi",
    response_model=FournisseurResponse,
    summary="Modifier mon profil fournisseur",
)
async def modifier_mon_fournisseur_endpoint(
    data: FournisseurUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    try:
        fournisseur = await modifier_fournisseur(data=data, user=current_user, db=db)
        return FournisseurResponse.model_validate(fournisseur)
    except FournisseurNotFoundError as e:
        _raise_semences_error(e)


# =============================================================================
# Certifications - routes statiques admin
# =============================================================================

@router.patch(
    "/certifications/{certification_id}/verification",
    response_model=CertificationProduitSchema,
    summary="Verifier une certification produit (Admin)",
)
async def verifier_certification_endpoint(
    certification_id: uuid.UUID,
    est_verifie: bool = Query(default=True),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CertificationProduitSchema:
    _require_admin(current_user)
    try:
        certification = await verifier_certification(
            certification_id=certification_id,
            est_verifie=est_verifie,
            db=db,
        )
        return CertificationProduitSchema.model_validate(certification)
    except SemencesError as e:
        _raise_semences_error(e)


# =============================================================================
# Produits - routes dynamiques
# =============================================================================

@router.get(
    "/produits/{produit_id}",
    response_model=ProduitResponse,
    summary="Detail d'un produit semence/plant",
)
async def detail_produit_endpoint(
    produit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProduitResponse:
    try:
        produit = await get_produit_by_id(produit_id=produit_id, db=db)
        return ProduitResponse.model_validate(produit)
    except ProduitNotFoundError as e:
        _raise_semences_error(e)


@router.patch(
    "/produits/{produit_id}",
    response_model=ProduitResponse,
    summary="Modifier un produit",
)
async def modifier_produit_endpoint(
    produit_id: uuid.UUID,
    data: ProduitUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> ProduitResponse:
    try:
        produit = await modifier_produit(
            produit_id=produit_id,
            data=data,
            user=current_user,
            db=db,
        )
        produit = await get_produit_by_id(produit.id, db, incrementer_vues=False)
        return ProduitResponse.model_validate(produit)
    except (ProduitNotFoundError, SemencesAccessDeniedError) as e:
        _raise_semences_error(e)


@router.patch(
    "/produits/{produit_id}/statut",
    response_model=ProduitResponse,
    summary="Changer le statut d'un produit (Admin)",
)
async def statut_produit_endpoint(
    produit_id: uuid.UUID,
    data: ProduitStatutUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> ProduitResponse:
    _require_admin(current_user)
    try:
        produit = await mettre_a_jour_statut_produit(
            produit_id=produit_id,
            data=data,
            db=db,
        )
        produit = await get_produit_by_id(produit.id, db, incrementer_vues=False)
        return ProduitResponse.model_validate(produit)
    except ProduitNotFoundError as e:
        _raise_semences_error(e)


@router.post(
    "/produits/{produit_id}/photos",
    response_model=PhotoUploadResponse,
    status_code=201,
    summary="Enregistrer une photo produit deja uploadee",
)
async def ajouter_photo_produit_endpoint(
    produit_id: uuid.UUID,
    nom_fichier: str = Query(..., min_length=1, max_length=255),
    url_stockage: str = Query(..., min_length=8, max_length=512),
    url_miniature: str | None = Query(default=None, max_length=512),
    taille_bytes: int | None = Query(default=None, ge=0),
    ordre: int = Query(default=0, ge=0, le=20),
    est_principale: bool = Query(default=False),
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> PhotoUploadResponse:
    try:
        photo = await ajouter_photo_produit(
            produit_id=produit_id,
            nom_fichier=nom_fichier,
            url_stockage=url_stockage,
            url_miniature=url_miniature,
            taille_bytes=taille_bytes,
            ordre=ordre,
            est_principale=est_principale,
            user=current_user,
            db=db,
        )
        return PhotoUploadResponse(
            id=photo.id,
            url_stockage=photo.url_stockage,
            url_miniature=photo.url_miniature,
            ordre=photo.ordre,
            est_principale=photo.est_principale,
        )
    except (ProduitNotFoundError, SemencesAccessDeniedError) as e:
        _raise_semences_error(e)


@router.post(
    "/produits/{produit_id}/certifications",
    response_model=CertificationProduitSchema,
    status_code=201,
    summary="Ajouter une certification produit",
)
async def ajouter_certification_endpoint(
    produit_id: uuid.UUID,
    data: CertificationCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> CertificationProduitSchema:
    try:
        certification = await ajouter_certification(
            produit_id=produit_id,
            data=data,
            user=current_user,
            db=db,
        )
        return CertificationProduitSchema.model_validate(certification)
    except (ProduitNotFoundError, SemencesAccessDeniedError) as e:
        _raise_semences_error(e)


@router.get(
    "/produits/{produit_id}/avis",
    response_model=AvisListResponse,
    summary="Lister les avis publies d'un produit",
)
async def lister_avis_produit_endpoint(
    produit_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> AvisListResponse:
    try:
        return await lister_avis_produit(
            produit_id=produit_id,
            db=db,
            page=page,
            size=size,
        )
    except ProduitNotFoundError as e:
        _raise_semences_error(e)


@router.post(
    "/produits/{produit_id}/avis",
    response_model=AvisProduitSchema,
    status_code=201,
    summary="Ajouter un avis sur un produit",
)
async def ajouter_avis_endpoint(
    produit_id: uuid.UUID,
    data: AvisCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> AvisProduitSchema:
    try:
        avis = await ajouter_avis(
            produit_id=produit_id,
            data=data,
            auteur=current_user,
            db=db,
        )
        return AvisProduitSchema.model_validate(avis)
    except (ProduitNotFoundError, SemencesError) as e:
        _raise_semences_error(e)


# =============================================================================
# Fournisseurs - routes dynamiques
# =============================================================================

@router.get(
    "/fournisseurs/{fournisseur_id}",
    response_model=FournisseurResponse,
    summary="Detail d'un fournisseur",
)
async def detail_fournisseur_endpoint(
    fournisseur_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    try:
        fournisseur = await get_fournisseur_by_id(fournisseur_id=fournisseur_id, db=db)
        return FournisseurResponse.model_validate(fournisseur)
    except FournisseurNotFoundError as e:
        _raise_semences_error(e)


@router.patch(
    "/fournisseurs/{fournisseur_id}/statut",
    response_model=FournisseurResponse,
    summary="Changer le statut d'un fournisseur (Admin)",
)
async def statut_fournisseur_endpoint(
    fournisseur_id: uuid.UUID,
    data: FournisseurStatutUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    _require_admin(current_user)
    try:
        fournisseur = await mettre_a_jour_statut_fournisseur(
            fournisseur_id=fournisseur_id,
            data=data,
            db=db,
        )
        return FournisseurResponse.model_validate(fournisseur)
    except FournisseurNotFoundError as e:
        _raise_semences_error(e)


@router.patch(
    "/fournisseurs/{fournisseur_id}/label",
    response_model=FournisseurResponse,
    summary="Attribuer ou retirer le Label Ivoire Semences (Admin)",
)
async def label_ivoire_endpoint(
    fournisseur_id: uuid.UUID,
    data: LabelIvoireUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> FournisseurResponse:
    _require_admin(current_user)
    try:
        fournisseur = await mettre_a_jour_label_ivoire(
            fournisseur_id=fournisseur_id,
            data=data,
            db=db,
        )
        return FournisseurResponse.model_validate(fournisseur)
    except (FournisseurNotFoundError, SemencesError) as e:
        _raise_semences_error(e)
