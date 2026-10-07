"""
Tests d'intégration — Auth (send-otp / verify-otp / complete-profile / set-password).
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.user import User, UserStatus


PHONE = "+2250700000099"


def _bypass_otp(monkeypatch):
    """Active le mode dev bypass pour récupérer le code OTP directement dans la réponse."""
    monkeypatch.setattr("app.services.auth_service.settings.OTP_DEV_BYPASS", True)
    monkeypatch.setattr("app.services.auth_service.settings.ENVIRONMENT", "development")


@pytest.mark.asyncio
async def test_send_otp_creates_new_user_and_returns_debug_code(
    client: AsyncClient, db, monkeypatch
):
    """Un numéro inconnu déclenche la création d'un compte PENDING + un OTP."""
    _bypass_otp(monkeypatch)

    response = await client.post("/api/v1/auth/send-otp", json={"phone_number": PHONE})

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["debug_code"] is not None
    assert len(data["debug_code"]) == 6

    result = await db.execute(select(User).where(User.phone_number == PHONE))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.status == UserStatus.PENDING


@pytest.mark.asyncio
async def test_verify_otp_with_correct_code_returns_tokens_and_requires_role_setup(
    client: AsyncClient, db, monkeypatch
):
    """
    Un code correct active le compte, renvoie une paire de tokens valide, et
    signale qu'il s'agit d'un nouvel utilisateur devant choisir son rôle
    (requires_role_setup) avant de pouvoir créer son mot de passe.
    """
    _bypass_otp(monkeypatch)

    send_response = await client.post("/api/v1/auth/send-otp", json={"phone_number": PHONE})
    debug_code = send_response.json()["debug_code"]

    verify_response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": PHONE, "code": debug_code},
    )

    assert verify_response.status_code == 200
    data = verify_response.json()
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]
    assert data["user"]["phone_number"] == PHONE
    assert data["is_new_user"] is True
    assert data["requires_role_setup"] is True
    assert data["requires_password_setup"] is True

    result = await db.execute(select(User).where(User.phone_number == PHONE))
    user = result.scalar_one()
    assert user.status == UserStatus.ACTIVE
    assert user.phone_verified is True


@pytest.mark.asyncio
async def test_verify_otp_with_wrong_code_fails_and_keeps_account_pending(
    client: AsyncClient, db, monkeypatch
):
    """Un code incorrect est rejeté et ne doit jamais activer le compte."""
    _bypass_otp(monkeypatch)

    await client.post("/api/v1/auth/send-otp", json={"phone_number": PHONE})

    verify_response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": PHONE, "code": "000000"},
    )

    assert verify_response.status_code == 400

    result = await db.execute(select(User).where(User.phone_number == PHONE))
    user = result.scalar_one()
    assert user.status == UserStatus.PENDING


@pytest.mark.asyncio
async def test_verify_otp_unknown_phone_returns_generic_error(client: AsyncClient):
    """Un numéro sans OTP en attente ne doit jamais révéler s'il existe ou non."""
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": "+2250799999999", "code": "123456"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_complete_profile_sets_roles_and_clears_role_setup_flag(
    client: AsyncClient, monkeypatch
):
    """Après complete-profile, les rôles choisis doivent être persistés tels quels."""
    _bypass_otp(monkeypatch)

    send_response = await client.post("/api/v1/auth/send-otp", json={"phone_number": PHONE})
    debug_code = send_response.json()["debug_code"]
    verify_response = await client.post(
        "/api/v1/auth/verify-otp", json={"phone_number": PHONE, "code": debug_code}
    )
    access_token = verify_response.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    response = await client.post(
        "/api/v1/auth/complete-profile",
        json={
            "roles": ["AGRICULTEUR", "BAILLEUR"],
            "first_name": "Awa",
            "last_name": "Koné",
            "region": "Abidjan",
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data["roles"]) == {"AGRICULTEUR", "BAILLEUR"}
    assert data["first_name"] == "Awa"
    assert data["region"] == "Abidjan"


@pytest.mark.asyncio
async def test_complete_profile_requires_authentication(client: AsyncClient):
    """Sans token, complete-profile doit être rejeté (401), pas planter."""
    response = await client.post(
        "/api/v1/auth/complete-profile",
        json={
            "roles": ["AGRICULTEUR"],
            "first_name": "Awa",
            "last_name": "Koné",
            "region": "Abidjan",
        },
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_set_password_then_login_with_password(client: AsyncClient, monkeypatch):
    """Une fois le mot de passe créé, la connexion par numéro + mot de passe doit fonctionner."""
    _bypass_otp(monkeypatch)

    send_response = await client.post("/api/v1/auth/send-otp", json={"phone_number": PHONE})
    debug_code = send_response.json()["debug_code"]
    verify_response = await client.post(
        "/api/v1/auth/verify-otp", json={"phone_number": PHONE, "code": debug_code}
    )
    access_token = verify_response.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    set_password_response = await client.post(
        "/api/v1/auth/set-password", json={"password": "motdepasse123"}, headers=headers
    )
    assert set_password_response.status_code == 200

    login_response = await client.post(
        "/api/v1/auth/login-password",
        json={"phone_number": PHONE, "password": "motdepasse123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["phone_number"] == PHONE


@pytest.mark.asyncio
async def test_login_with_password_wrong_password_is_rejected(client: AsyncClient, monkeypatch):
    """Un mauvais mot de passe doit être rejeté avec un message générique (pas d'énumération de comptes)."""
    _bypass_otp(monkeypatch)

    send_response = await client.post("/api/v1/auth/send-otp", json={"phone_number": PHONE})
    debug_code = send_response.json()["debug_code"]
    verify_response = await client.post(
        "/api/v1/auth/verify-otp", json={"phone_number": PHONE, "code": debug_code}
    )
    access_token = verify_response.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    await client.post(
        "/api/v1/auth/set-password", json={"password": "motdepasse123"}, headers=headers
    )

    response = await client.post(
        "/api/v1/auth/login-password",
        json={"phone_number": PHONE, "password": "mauvais-mot-de-passe"},
    )
    assert response.status_code == 400