from decimal import ROUND_HALF_UP, Decimal


def format_fcfa(amount: float | int | Decimal, symbol: bool = True) -> str:
    """
    Formate un montant en FCFA pour l'affichage.

    format_fcfa(1500000)      → "1 500 000 FCFA"
    format_fcfa(1500000, False) → "1 500 000"
    format_fcfa(2500.75)      → "2 501 FCFA"  (arrondi à l'entier le plus proche)
    """
    rounded = int(Decimal(str(amount)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    grouped = f"{abs(rounded):,}".replace(",", " ")
    sign = "-" if rounded < 0 else ""
    result = f"{sign}{grouped}"
    return f"{result} FCFA" if symbol else result


def parse_fcfa(formatted: str) -> int:
    """
    Reconvertit une chaîne formatée (ou saisie utilisateur) en entier.
    Tolère les espaces, espaces insécables, virgules et le suffixe "FCFA".

    parse_fcfa("1 500 000 FCFA") → 1500000
    parse_fcfa("1,500,000")      → 1500000
    """
    cleaned = (
        formatted.strip()
        .upper()
        .replace("FCFA", "")
        .replace("XOF", "")
        .replace("\u202f", "")  # espace insécable fine
        .replace("\xa0", "")  # espace insécable
        .replace(" ", "")
        .replace(",", "")
        .strip()
    )
    if not cleaned:
        raise ValueError("Montant vide")
    try:
        return int(Decimal(cleaned))
    except Exception as exc:
        raise ValueError(f"Montant FCFA invalide : {formatted!r}") from exc


def is_montant_valide(amount: float | int) -> bool:
    """Un montant FCFA doit être un nombre positif (les décimales n'ont pas de sens)."""
    return amount is not None and amount >= 0