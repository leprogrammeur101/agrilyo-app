"""
Service de rappels automatiques — M3 Conseil AGRILYO.

Objectif : envoyer un SMS de rappel la veille de chaque opération planifiée
(semis, traitement, récolte...) dont `rappel_sms=True` et qui n'a pas encore
été notifiée.

Ce service est volontairement autonome et sans dépendance à un scheduler :
il est prêt à être appelé soit par un endpoint admin (déclenchement manuel /
via cron classique), soit plus tard par Celery beat (déjà dans requirements.txt
mais non configuré — hors périmètre de ce sprint, cf. "préparer le service").
"""

import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conseil import OperationPlanning, PlanningCultural, StatutOperationPlanning
from app.models.user import User
from app.services.notification_service import notifier_rappel_operation

logger = logging.getLogger(__name__)


async def envoyer_rappels_operations(db: AsyncSession) -> dict:
    """
    Envoie un rappel SMS pour chaque opération prévue demain, non encore
    notifiée. Retourne un résumé {examinees, envoyes, echecs}.

    Idempotent : une opération dont `rappel_envoye_le` est déjà renseigné
    n'est jamais re-notifiée, donc cette fonction peut être appelée plusieurs
    fois par jour sans risque de spam (utile tant qu'aucun scheduler n'est
    branché et que le déclenchement reste manuel/cron externe).
    """
    demain = date.today() + timedelta(days=1)

    result = await db.execute(
        select(OperationPlanning)
        .options(selectinload(OperationPlanning.planning))
        .where(
            OperationPlanning.date_prevue == demain,
            OperationPlanning.rappel_sms.is_(True),
            OperationPlanning.rappel_envoye_le.is_(None),
            OperationPlanning.statut == StatutOperationPlanning.A_FAIRE,
        )
    )
    operations = result.scalars().all()

    envoyes = 0
    echecs = 0

    for operation in operations:
        planning: PlanningCultural = operation.planning
        agriculteur = await db.get(User, planning.agriculteur_id)
        if not agriculteur:
            echecs += 1
            continue

        try:
            success = await notifier_rappel_operation(
                phone_number=agriculteur.phone_number,
                titre_operation=operation.titre,
            )
        except Exception:
            logger.exception("Echec envoi rappel operation %s", operation.id)
            success = False

        if success:
            operation.rappel_envoye_le = datetime.now(timezone.utc)
            envoyes += 1
        else:
            echecs += 1

    await db.commit()
    logger.info(
        "Rappels operations planning: %s examinees, %s envoyes, %s echecs",
        len(operations),
        envoyes,
        echecs,
    )
    return {"examinees": len(operations), "envoyes": envoyes, "echecs": echecs}