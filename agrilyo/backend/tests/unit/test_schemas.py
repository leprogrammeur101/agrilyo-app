"""
Tests unitaires — utilitaires partagés (phone, fcfa, pagination) et validation
Pydantic des schémas Auth. Aucune base de données requise.
"""

import pytest
from pydantic import ValidationError

from app.schemas.auth import CompleteProfileRequest, SendOTPRequest
from app.utils.fcfa import format_fcfa, is_montant_valide, parse_fcfa
from app.utils.pagination import compute_total_pages, get_page_params
from app.utils.phone import format_ci_phone_display, is_valid_ci_phone, normalize_ci_phone


# ── utils/phone.py ────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "raw,expected",
    [
        ("0700000000", "+2250700000000"),
        ("225 07 00 00 00 00", "+2250700000000"),
        ("+225 07 00 00 00 00", "+2250700000000"),
        ("+2250700000000", "+2250700000000"),
    ],
)
def test_normalize_ci_phone_accepts_common_formats(raw, expected):
    assert normalize_ci_phone(raw) == expected


def test_normalize_ci_phone_rejects_invalid_number():
    with pytest.raises(ValueError):
        normalize_ci_phone("12345")


def test_is_valid_ci_phone_never_raises():
    assert is_valid_ci_phone("+2250700000000") is True
    assert is_valid_ci_phone("not-a-phone") is False


def test_format_ci_phone_display_groups_by_two_digits():
    assert format_ci_phone_display("+2250700000000") == "07 00 00 00 00"


def test_format_ci_phone_display_returns_input_unchanged_if_not_e164():
    assert format_ci_phone_display("0700000000") == "0700000000"


# ── utils/fcfa.py ─────────────────────────────────────────────────────────────

def test_format_fcfa_groups_thousands_with_space():
    assert format_fcfa(1500000) == "1 500 000 FCFA"
    assert format_fcfa(1500000, symbol=False) == "1 500 000"


def test_format_fcfa_rounds_to_nearest_integer():
    assert format_fcfa(2500.75) == "2 501 FCFA"


def test_format_fcfa_handles_negative_amounts():
    assert format_fcfa(-500) == "-500 FCFA"


def test_parse_fcfa_reverses_format_fcfa():
    assert parse_fcfa("1 500 000 FCFA") == 1500000
    assert parse_fcfa("1,500,000") == 1500000


def test_parse_fcfa_rejects_empty_input():
    with pytest.raises(ValueError):
        parse_fcfa("   ")


def test_is_montant_valide():
    assert is_montant_valide(1000) is True
    assert is_montant_valide(0) is True
    assert is_montant_valide(-1) is False
    assert is_montant_valide(None) is False


# ── utils/pagination.py ────────────────────────────────────────────────────────

def test_get_page_params_normalizes_bounds():
    params = get_page_params(page=0, size=500, max_size=100)
    assert params.page == 1
    assert params.size == 100
    assert params.offset == 0
    assert params.limit == 100


def test_get_page_params_computes_offset():
    params = get_page_params(page=3, size=20)
    assert params.offset == 40


def test_compute_total_pages_rounds_up():
    assert compute_total_pages(total=41, size=20) == 3
    assert compute_total_pages(total=0, size=20) == 1


# ── schemas/auth.py — validation Pydantic ──────────────────────────────────────

def test_send_otp_request_normalizes_phone_via_validator():
    """Le schéma Pydantic doit appliquer normalize_ci_phone automatiquement."""
    req = SendOTPRequest(phone_number="0700000000")
    assert req.phone_number == "+2250700000000"

    with pytest.raises(ValidationError):
        SendOTPRequest(phone_number="abc")


def test_complete_profile_request_accepts_selectable_roles():
    req = CompleteProfileRequest(
        roles=["AGRICULTEUR", "AGRONOME"],
        first_name="Awa",
        last_name="Koné",
        region="Abidjan",
    )
    assert req.roles == ["AGRICULTEUR", "AGRONOME"]


def test_complete_profile_request_rejects_admin_role():
    """ADMIN ne doit jamais être sélectionnable par l'utilisateur lui-même."""
    with pytest.raises(ValidationError):
        CompleteProfileRequest(
            roles=["ADMIN"], first_name="X", last_name="Y", region="Abidjan"
        )


def test_complete_profile_request_deduplicates_roles():
    req = CompleteProfileRequest(
        roles=["AGRICULTEUR", "AGRICULTEUR", "BAILLEUR"],
        first_name="Awa",
        last_name="Koné",
        region="Abidjan",
    )
    assert req.roles == ["AGRICULTEUR", "BAILLEUR"]


def test_complete_profile_request_requires_at_least_one_role():
    with pytest.raises(ValidationError):
        CompleteProfileRequest(roles=[], first_name="X", last_name="Y", region="Abidjan")