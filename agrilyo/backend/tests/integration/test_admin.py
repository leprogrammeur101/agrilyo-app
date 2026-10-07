"""
Tests d'intégration — Back-office Admin (validation agronomes/fournisseurs,
suspension utilisateurs, garde d'accès).
"""

import pytest
from httpx import AsyncClient

from app.models.conseil import Agronome, StatutAgronome
from app.models.semences import FournisseurSemences, StatutFournisseur
from app.models.user import UserRole, UserStatus


@pytest.mark.asyncio
async def test_non_admin_refuse_acces_aux_routes_admin(
    client: AsyncClient, make_user, auth_headers
):
    """Un utilisateur sans le rôle ADMIN doit être rejeté (403), pas juste redirigé côté client."""
    agriculteur = await make_user(phone_number="+2250700000201")

    response = await client.get("/api/v1/admin/kpis", headers=auth_headers(agriculteur))

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_validation_agronome_en_attente_vers_verifie(
    client: AsyncClient, db, make_user, auth_headers
):
    """Un agronome EN_ATTENTE passe à VERIFIE et sort de la file d'attente admin."""
    admin = await make_user(phone_number="+2250700000202", roles=[UserRole.ADMIN])
    agronome_user = await make_user(
        phone_number="+2250700000203", roles=[UserRole.AGRONOME]
    )

    agronome = Agronome(
        user_id=agronome_user.id,
        titre="Spécialiste cacao",
        statut=StatutAgronome.EN_ATTENTE,
    )
    db.add(agronome)
    await db.commit()
    await db.refresh(agronome)

    response = await client.patch(
        f"/api/v1/admin/agronomes/{agronome.id}/validate",
        json={"decision": "VERIFIE", "motif": "Dossier complet"},
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    assert response.json()["statut"] == "VERIFIE"

    # Ne doit plus apparaître dans la file EN_ATTENTE
    file_attente = await client.get(
        "/api/v1/admin/agronomes", params={"statut": "EN_ATTENTE"}, headers=auth_headers(admin)
    )
    ids_en_attente = [item["id"] for item in file_attente.json()["items"]]
    assert str(agronome.id) not in ids_en_attente


@pytest.mark.asyncio
async def test_validation_agronome_deja_traite_est_rejetee(
    client: AsyncClient, db, make_user, auth_headers
):
    """Un profil déjà VERIFIE ne doit pas pouvoir être re-décidé via /validate (400 clair)."""
    admin = await make_user(phone_number="+2250700000204", roles=[UserRole.ADMIN])
    agronome_user = await make_user(
        phone_number="+2250700000205", roles=[UserRole.AGRONOME]
    )
    agronome = Agronome(
        user_id=agronome_user.id, titre="Déjà validé", statut=StatutAgronome.VERIFIE
    )
    db.add(agronome)
    await db.commit()
    await db.refresh(agronome)

    response = await client.patch(
        f"/api/v1/admin/agronomes/{agronome.id}/validate",
        json={"decision": "REJETE"},
        headers=auth_headers(admin),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_rejet_fournisseur_en_attente(
    client: AsyncClient, db, make_user, auth_headers
):
    """Un fournisseur EN_ATTENTE peut être rejeté, avec motif conservé."""
    admin = await make_user(phone_number="+2250700000206", roles=[UserRole.ADMIN])
    fournisseur_user = await make_user(
        phone_number="+2250700000207", roles=[UserRole.SEMENCIER]
    )
    fournisseur = FournisseurSemences(
        user_id=fournisseur_user.id,
        nom_commercial="Semences du Nord",
        region="Korhogo",
        statut=StatutFournisseur.EN_ATTENTE,
    )
    db.add(fournisseur)
    await db.commit()
    await db.refresh(fournisseur)

    response = await client.patch(
        f"/api/v1/admin/fournisseurs/{fournisseur.id}/validate",
        json={"decision": "REJETE", "motif": "Documents manquants"},
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["statut"] == "REJETE"
    assert data["note_admin"] == "Documents manquants"


@pytest.mark.asyncio
async def test_suspension_utilisateur(client: AsyncClient, db, make_user, auth_headers):
    """Un admin peut suspendre un compte ACTIVE ; le statut est bien persisté."""
    admin = await make_user(phone_number="+2250700000208", roles=[UserRole.ADMIN])
    cible = await make_user(phone_number="+2250700000209", status=UserStatus.ACTIVE)

    response = await client.patch(
        f"/api/v1/admin/users/{cible.id}/status",
        json={"status": "SUSPENDED", "motif": "Signalement abusif"},
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "SUSPENDED"


@pytest.mark.asyncio
async def test_admin_ne_peut_pas_se_suspendre_lui_meme(
    client: AsyncClient, make_user, auth_headers
):
    """Garde-fou : un admin ne doit pas pouvoir modifier son propre statut."""
    admin = await make_user(phone_number="+2250700000210", roles=[UserRole.ADMIN])

    response = await client.patch(
        f"/api/v1/admin/users/{admin.id}/status",
        json={"status": "SUSPENDED"},
        headers=auth_headers(admin),
    )

    assert response.status_code == 400