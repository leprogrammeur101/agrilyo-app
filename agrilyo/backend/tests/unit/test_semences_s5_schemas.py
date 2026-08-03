import os
from uuid import uuid4

import pytest
from pydantic import ValidationError

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")

from app.models.semences import StatutCommandeSemences
from app.schemas.semences import (
    CommandeCreate,
    CommandeFromPanierCreate,
    CommandeStatutUpdate,
    LigneCommandeCreate,
    PanierItemCreate,
    PanierItemUpdate,
)


def test_commande_create_accepts_valid_lines_and_contact() -> None:
    produit_id = uuid4()

    payload = CommandeCreate(
        lignes=[LigneCommandeCreate(produit_id=produit_id, quantite=2)],
        telephone_contact="+2250700000000",
        region_livraison="Abidjan",
    )

    assert payload.lignes[0].produit_id == produit_id
    assert payload.telephone_contact == "+2250700000000"


def test_commande_create_rejects_duplicate_products() -> None:
    produit_id = uuid4()

    with pytest.raises(ValidationError) as exc_info:
        CommandeCreate(
            lignes=[
                LigneCommandeCreate(produit_id=produit_id, quantite=1),
                LigneCommandeCreate(produit_id=produit_id, quantite=2),
            ]
        )

    assert "Deux lignes ne peuvent pas" in str(exc_info.value)


def test_commande_create_rejects_non_e164_phone() -> None:
    with pytest.raises(ValidationError) as exc_info:
        CommandeCreate(
            lignes=[LigneCommandeCreate(produit_id=uuid4(), quantite=1)],
            telephone_contact="0700000000",
        )

    assert "format E.164" in str(exc_info.value)


def test_commande_from_panier_reuses_phone_validation() -> None:
    with pytest.raises(ValidationError):
        CommandeFromPanierCreate(telephone_contact="01020304")


def test_panier_items_require_positive_quantities() -> None:
    with pytest.raises(ValidationError):
        PanierItemCreate(produit_id=uuid4(), quantite=0)

    with pytest.raises(ValidationError):
        PanierItemUpdate(quantite=-1)


def test_annulation_requires_admin_note() -> None:
    with pytest.raises(ValidationError) as exc_info:
        CommandeStatutUpdate(statut=StatutCommandeSemences.ANNULEE)

    assert "note explicative" in str(exc_info.value)


def test_non_annulation_status_does_not_require_note() -> None:
    update = CommandeStatutUpdate(statut=StatutCommandeSemences.EN_PREPARATION)

    assert update.note_admin is None
