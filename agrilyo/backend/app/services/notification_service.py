"""
Service notifications AGRILYO.

Sprint 5 utilise une version legere : notifications SMS opportunistes pour
les commandes Semences. Les echecs d'envoi sont journalises par sms_service et
ne doivent jamais bloquer le workflow commande.
"""

import logging

from app.models.semences import CommandeSemences, StatutCommandeSemences
from app.models.user import User
from app.services.sms_service import send_sms

logger = logging.getLogger(__name__)

STATUT_COMMANDE_LABELS: dict[StatutCommandeSemences, str] = {
    StatutCommandeSemences.BROUILLON: "brouillon",
    StatutCommandeSemences.CONFIRMEE: "confirmee",
    StatutCommandeSemences.EN_ATTENTE_PAIEMENT: "en attente de paiement",
    StatutCommandeSemences.PAYEE: "payee",
    StatutCommandeSemences.ANNULEE: "annulee",
    StatutCommandeSemences.ECHEC_PAIEMENT: "en echec de paiement",
    StatutCommandeSemences.EN_PREPARATION: "en preparation",
    StatutCommandeSemences.LIVREE: "livree",
}


def _format_fcfa(amount: float) -> str:
    return f"{amount:,.0f}".replace(",", " ") + " FCFA"


async def notifier_commande_confirmee(
    commande: CommandeSemences,
    acheteur: User,
) -> bool:
    """Notifie l'acheteur apres creation d'une commande sans paiement."""
    phone_number = commande.telephone_contact or acheteur.phone_number
    if not phone_number:
        logger.info("Notification commande %s ignoree: aucun telephone", commande.id)
        return False

    message = (
        f"AGRILYO: commande {commande.reference} confirmee "
        f"pour {_format_fcfa(commande.montant_total)}. "
        "Suivez son statut dans l'application."
    )
    return await send_sms(phone_number=phone_number, message=message)


async def notifier_statut_commande(
    commande: CommandeSemences,
    acheteur: User | None = None,
) -> bool:
    """Notifie l'acheteur lorsqu'une commande change de statut."""
    phone_number = commande.telephone_contact or (acheteur.phone_number if acheteur else None)
    if not phone_number:
        logger.info("Notification statut commande %s ignoree: aucun telephone", commande.id)
        return False

    statut_label = STATUT_COMMANDE_LABELS.get(commande.statut, commande.statut.value.lower())
    message = f"AGRILYO: votre commande {commande.reference} est maintenant {statut_label}."
    return await send_sms(phone_number=phone_number, message=message)
