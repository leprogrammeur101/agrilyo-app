"""
Tests unitaires — app/core/security.py (JWT, hachage, OTP).
Aucune base de données requise.
"""

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_otp,
    hash_value,
    verify_hash,
    verify_token,
)


def test_hash_value_is_not_reversible_but_verifiable():
    """hash_value produit un hash salé différent à chaque appel, mais verify_hash reconnaît le bon."""
    hashed_a = hash_value("123456")
    hashed_b = hash_value("123456")

    assert hashed_a != hashed_b  # sels différents à chaque appel
    assert verify_hash("123456", hashed_a) is True
    assert verify_hash("123456", hashed_b) is True
    assert verify_hash("000000", hashed_a) is False


def test_verify_hash_never_raises_on_garbage_input():
    """Un hash stocké corrompu/invalide ne doit jamais faire planter verify_hash."""
    assert verify_hash("123456", "not-a-valid-base64-hash") is False
    assert verify_hash("123456", "") is False


def test_access_token_roundtrip():
    """Un token d'accès généré pour un user_id doit se décoder vers le même sujet."""
    token = create_access_token("user-123")
    subject = verify_token(token, token_type="access")
    assert subject == "user-123"


def test_refresh_token_rejected_as_access_token():
    """Un refresh token ne doit jamais être accepté comme access token (types distincts)."""
    refresh = create_refresh_token("user-123")
    assert verify_token(refresh, token_type="access") is None
    assert verify_token(refresh, token_type="refresh") == "user-123"


def test_verify_token_rejects_garbage():
    """Un token mal formé ne doit jamais lever d'exception, juste renvoyer None."""
    assert verify_token("not-a-jwt-at-all") is None


def test_generate_otp_has_expected_length_and_is_numeric(monkeypatch):
    """Force la génération aléatoire (hors bypass dev) pour tester la vraie logique."""
    monkeypatch.setattr(settings, "OTP_DEV_BYPASS", False)
    code = generate_otp()
    assert code.isdigit()
    assert len(code) == settings.OTP_LENGTH


def test_generate_otp_uses_fixed_code_in_dev_bypass(monkeypatch):
    """En mode bypass dev, le code doit toujours être celui configuré (prévisible pour les tests manuels)."""
    monkeypatch.setattr(settings, "OTP_DEV_BYPASS", True)
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    assert generate_otp() == settings.OTP_DEV_CODE