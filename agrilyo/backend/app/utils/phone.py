import re

CI_PHONE_PATTERN = re.compile(r"^\+225\d{10}$")


def normalize_ci_phone(raw: str) -> str:
    """
    Normalise un numéro ivoirien saisi sous différentes formes vers le format
    E.164 (+225XXXXXXXXXX). Lève ValueError si le numéro est invalide.

    Formats acceptés en entrée :
      - "0700000000"        (10 chiffres locaux)
      - "225 07 00 00 00 00" (préfixe pays sans +, avec espaces/tirets)
      - "+225 07 00 00 00 00"
      - "+2250700000000"     (déjà normalisé)
    """
    value = raw.strip().replace(" ", "").replace("-", "").replace(".", "")

    if not value.startswith("+"):
        if value.startswith("225"):
            value = "+" + value
        elif len(value) == 10:
            value = "+225" + value
        else:
            raise ValueError("Format invalide. Exemple attendu : +2250700000000")

    if not CI_PHONE_PATTERN.match(value):
        raise ValueError(
            "Numéro ivoirien invalide. Format attendu : +2250700000000 (10 chiffres après +225)"
        )

    return value


def is_valid_ci_phone(raw: str) -> bool:
    """Version booléenne de normalize_ci_phone — ne lève jamais d'exception."""
    try:
        normalize_ci_phone(raw)
        return True
    except ValueError:
        return False


def format_ci_phone_display(e164: str) -> str:
    """
    Formate un numéro E.164 pour l'affichage humain.
    +2250700000000 → "07 00 00 00 00"
    Retourne la valeur d'origine si le format ne correspond pas.
    """
    if not CI_PHONE_PATTERN.match(e164):
        return e164
    local = e164[4:]  # retire "+225"
    return " ".join(local[i : i + 2] for i in range(0, len(local), 2))