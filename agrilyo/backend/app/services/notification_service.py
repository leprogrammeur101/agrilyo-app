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
from app.utils.fcfa import format_fcfa

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
        f"pour {format_fcfa(commande.montant_total)}. "
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


# ═══════════════════════════════════════════════════════════════════════════════
# M3 Conseil — les echecs d'envoi ne doivent jamais bloquer le workflow metier,
# meme logique que pour les commandes Semences ci-dessus.
# ═══════════════════════════════════════════════════════════════════════════════

async def notifier_demande_recue(agriculteur: User, titre_demande: str) -> bool:
    """Confirme a l'agriculteur que sa demande de conseil a bien ete recue."""
    if not agriculteur.phone_number:
        return False
    message = (
        f"AGRILYO: votre demande de conseil \"{titre_demande}\" a ete recue. "
        "Un agronome va vous etre propose sous peu."
    )
    return await send_sms(phone_number=agriculteur.phone_number, message=message)


async def notifier_demande_assignee(agriculteur: User, agronome_titre: str) -> bool:
    """Notifie l'agriculteur qu'un agronome a ete assigne a sa demande."""
    if not agriculteur.phone_number:
        return False
    message = f"AGRILYO: {agronome_titre} a ete assigne(e) a votre demande de conseil."
    return await send_sms(phone_number=agriculteur.phone_number, message=message)


async def notifier_session_planifiee(
    phone_number: str | None,
    scheduled_at,
) -> bool:
    """Notifie qu'une session de conseil a ete planifiee (agriculteur et/ou agronome)."""
    if not phone_number:
        return False
    quand = scheduled_at.strftime("%d/%m/%Y a %H:%M") if scheduled_at else "bientot"
    message = f"AGRILYO: votre session de conseil est planifiee pour le {quand}."
    return await send_sms(phone_number=phone_number, message=message)


async def notifier_rappel_operation(phone_number: str | None, titre_operation: str) -> bool:
    """Rappel SMS la veille d'une operation planifiee (semis, traitement, recolte...)."""
    if not phone_number:
        return False
    message = f"AGRILYO Rappel: \"{titre_operation}\" est prevue demain dans votre planning cultural."
    return await send_sms(phone_number=phone_number, message=message)