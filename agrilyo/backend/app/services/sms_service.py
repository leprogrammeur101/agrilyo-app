"""
Service SMS — Africa's Talking
Envoi des OTP et notifications SMS pour les utilisateurs sans push.
"""

import logging
from typing import Literal

import africastalking

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialisation du SDK Africa's Talking
_initialized = False


def _init_sdk() -> None:
    global _initialized
    if not _initialized:
        africastalking.initialize(
            username=settings.AT_USERNAME,
            api_key=settings.AT_API_KEY,
        )
        _initialized = True


def _get_sms_service():
    _init_sdk()
    return africastalking.SMS


# ── Messages OTP par langue ────────────────────────────────────────────────────
OTP_MESSAGES = {
    "fr": "Votre code AGRILYO : {code}. Valable {minutes} min. Ne partagez jamais ce code.",
    "en": "Your AGRILYO code: {code}. Valid for {minutes} min. Never share this code.",
}


async def send_otp_sms(
    phone_number: str,
    otp_code: str,
    language: str = "fr",
) -> bool:
    """
    Envoie un SMS OTP au numéro donné.
    En mode développement (sandbox AT), logge le code sans l'envoyer réellement.
    Retourne True si l'envoi est réussi, False sinon.
    """
    message_template = OTP_MESSAGES.get(language, OTP_MESSAGES["fr"])
    message = message_template.format(
        code=otp_code,
        minutes=settings.OTP_EXPIRE_MINUTES,
    )

    # Mode dev : pas d'envoi réel, log du code
    if settings.is_development and settings.OTP_DEV_BYPASS:
        logger.info(
            f"[DEV MODE] OTP pour {phone_number}: {otp_code} "
            f"(pas d'envoi SMS réel en développement)"
        )
        return True

    try:
        sms = _get_sms_service()
        response = sms.send(
            message=message,
            recipients=[phone_number],
            sender_id=settings.AT_SENDER_ID,
        )
        logger.info(f"SMS OTP envoyé à {phone_number}: {response}")
        return True
    except Exception as exc:
        logger.error(f"Échec envoi SMS OTP à {phone_number}: {exc}")
        return False


async def send_sms(
    phone_number: str,
    message: str,
) -> bool:
    """
    Envoi générique d'un SMS (notifications, rappels planning, etc.)
    """
    if settings.is_development:
        logger.info(f"[DEV MODE] SMS à {phone_number}: {message}")
        return True

    try:
        sms = _get_sms_service()
        response = sms.send(
            message=message,
            recipients=[phone_number],
            sender_id=settings.AT_SENDER_ID,
        )
        logger.info(f"SMS envoyé à {phone_number}")
        return True
    except Exception as exc:
        logger.error(f"Échec envoi SMS à {phone_number}: {exc}")
        return False