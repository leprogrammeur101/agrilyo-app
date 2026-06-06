"""
Service Contrat AGRILYO — Sprint 3
Logique : messagerie, création contrats, signature OTP + SHA-256, litiges.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import generate_otp, get_otp_expiry, hash_value, verify_hash
from app.models.foncier import (
    AnnonceFonciere,
    ContratFoncier,
    LitigeFoncier,
    MessageFoncier,
    StatutContrat,
    StatutLitige,
    ThreadFoncier,
)
from app.models.otp import OTPCode, OTPPurpose
from app.models.user import User
from app.schemas.contrat import (
    ContratCreate,
    LitigeCreate,
    MessageCreate,
    ThreadCreate,
)
from app.services.sms_service import send_otp_sms


# ═══════════════════════════════════════════════════════════════════════════════
# Exceptions
# ═══════════════════════════════════════════════════════════════════════════════

class ContratError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


class ContratNotFoundError(ContratError):
    def __init__(self):
        super().__init__("Contrat introuvable", 404)


class ThreadNotFoundError(ContratError):
    def __init__(self):
        super().__init__("Thread introuvable", 404)


# ═══════════════════════════════════════════════════════════════════════════════
# Messagerie
# ═══════════════════════════════════════════════════════════════════════════════

async def creer_thread(
    data: ThreadCreate,
    demandeur: User,
    db: AsyncSession,
) -> ThreadFoncier:
    """
    Ouvre un thread de messagerie entre un agriculteur et un bailleur.
    Un seul thread par (annonce, demandeur) — évite les doublons.
    """
    # Vérifier que l'annonce existe
    annonce = await db.get(AnnonceFonciere, data.annonce_id)
    if not annonce:
        raise ContratError("Annonce introuvable", 404)

    # Vérifier qu'un thread n'existe pas déjà
    existing = await db.execute(
        select(ThreadFoncier).where(
            ThreadFoncier.annonce_id == data.annonce_id,
            ThreadFoncier.demandeur_id == demandeur.id,
        )
    )
    thread = existing.scalar_one_or_none()

    if thread:
        # Thread existant — ajouter le message
        message = MessageFoncier(
            thread_id=thread.id,
            auteur_id=demandeur.id,
            contenu=data.message_initial,
        )
        db.add(message)
        return thread

    # Nouveau thread
    thread = ThreadFoncier(
        annonce_id=data.annonce_id,
        demandeur_id=demandeur.id,
    )
    db.add(thread)
    await db.flush()

    # Premier message
    message = MessageFoncier(
        thread_id=thread.id,
        auteur_id=demandeur.id,
        contenu=data.message_initial,
    )
    db.add(message)
    await db.flush()
    return thread


async def envoyer_message(
    thread_id: uuid.UUID,
    data: MessageCreate,
    auteur: User,
    db: AsyncSession,
) -> MessageFoncier:
    """Envoie un message dans un thread existant."""
    thread = await db.get(ThreadFoncier, thread_id)
    if not thread:
        raise ThreadNotFoundError()

    # Vérifier que l'auteur fait partie du thread (demandeur ou bailleur)
    annonce = await db.get(AnnonceFonciere, thread.annonce_id)
    if not annonce:
        raise ContratError("Annonce introuvable", 404)
    if auteur.id not in (thread.demandeur_id, annonce.bailleur_id):
        raise ContratError("Vous ne participez pas à ce thread", 403)

    message = MessageFoncier(
        thread_id=thread_id,
        auteur_id=auteur.id,
        contenu=data.contenu,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def get_thread(
    thread_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> ThreadFoncier:
    """Récupère un thread avec ses messages."""
    result = await db.execute(
        select(ThreadFoncier)
        .options(
            selectinload(ThreadFoncier.messages).selectinload(MessageFoncier.auteur),
            selectinload(ThreadFoncier.annonce),
        )
        .where(ThreadFoncier.id == thread_id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise ThreadNotFoundError()

    # Marquer les messages comme lus
    annonce = thread.annonce
    if user.id in (thread.demandeur_id, annonce.bailleur_id):
        for msg in thread.messages:
            if msg.auteur_id != user.id and not msg.lu:
                msg.lu = True

    return thread


async def mes_threads(
    user: User,
    db: AsyncSession,
) -> List[ThreadFoncier]:
    """Retourne tous les threads de l'utilisateur (comme demandeur ou bailleur)."""
    result = await db.execute(
        select(ThreadFoncier)
        .options(
            selectinload(ThreadFoncier.messages),
            selectinload(ThreadFoncier.annonce),
        )
        .join(AnnonceFonciere, ThreadFoncier.annonce_id == AnnonceFonciere.id)
        .where(
            (ThreadFoncier.demandeur_id == user.id) |
            (AnnonceFonciere.bailleur_id == user.id)
        )
        .order_by(ThreadFoncier.updated_at.desc())
    )
    return list(result.scalars().all())


# ═══════════════════════════════════════════════════════════════════════════════
# Contrats
# ═══════════════════════════════════════════════════════════════════════════════

async def creer_contrat(
    data: ContratCreate,
    bailleur: User,
    db: AsyncSession,
) -> ContratFoncier:
    """
    Crée un brouillon de contrat.
    Seul le bailleur de l'annonce peut initier un contrat.
    """
    annonce = await db.get(AnnonceFonciere, data.annonce_id)
    if not annonce:
        raise ContratError("Annonce introuvable", 404)
    if annonce.bailleur_id != bailleur.id:
        raise ContratError("Seul le bailleur peut créer un contrat", 403)

    # Vérifier qu'un contrat n'existe pas déjà
    existing = await db.execute(
        select(ContratFoncier).where(ContratFoncier.annonce_id == data.annonce_id)
    )
    if existing.scalar_one_or_none():
        raise ContratError("Un contrat existe déjà pour cette annonce", 409)

    contrat = ContratFoncier(
        annonce_id=data.annonce_id,
        locataire_id=data.locataire_id,
        bailleur_id=bailleur.id,
        type_contrat=data.type_contrat,
        date_debut=data.date_debut,
        date_fin=data.date_fin,
        montant_fcfa=data.montant_fcfa,
        statut=StatutContrat.BROUILLON,
    )
    db.add(contrat)
    await db.flush()
    await db.refresh(contrat)
    return contrat


async def get_contrat(
    contrat_id: uuid.UUID,
    db: AsyncSession,
) -> ContratFoncier:
    """Récupère un contrat par son ID."""
    contrat = await db.get(ContratFoncier, contrat_id)
    if not contrat:
        raise ContratNotFoundError()
    return contrat


async def demander_otp_signature(
    contrat_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> str:
    """
    Génère et envoie un OTP pour signer le contrat.
    Retourne le code (dev) ou un message de confirmation (prod).
    """
    contrat = await get_contrat(contrat_id, db)

    # Vérifier que l'utilisateur est bien partie au contrat
    if user.id not in (contrat.bailleur_id, contrat.locataire_id):
        raise ContratError("Vous n'êtes pas partie à ce contrat", 403)

    if contrat.statut == StatutContrat.SIGNE:
        raise ContratError("Ce contrat est déjà signé", 400)

    # Invalider les OTP précédents pour cet utilisateur
    old_otps = await db.execute(
        select(OTPCode).where(
            OTPCode.user_id == user.id,
            OTPCode.purpose == OTPPurpose.DOCUMENT_SIGN,
            OTPCode.is_used == False,
        )
    )
    for old in old_otps.scalars().all():
        old.is_used = True

    # Générer le nouvel OTP
    from app.core.security import generate_otp, get_otp_expiry, hash_value
    otp_code = generate_otp()
    otp_record = OTPCode(
        user_id=user.id,
        code_hash=hash_value(otp_code),
        purpose=OTPPurpose.DOCUMENT_SIGN,
        expires_at=get_otp_expiry(),
    )
    db.add(otp_record)

    # Envoyer le SMS
    await send_otp_sms(
        phone_number=user.phone_number,
        otp_code=otp_code,
    )

    return otp_code  # retourné uniquement en dev (OTP_DEV_BYPASS)


async def signer_contrat(
    contrat_id: uuid.UUID,
    code_otp: str,
    user: User,
    db: AsyncSession,
) -> ContratFoncier:
    """
    Signe le contrat avec vérification OTP.
    Quand les deux parties ont signé : horodatage + hash SHA-256.
    """
    contrat = await get_contrat(contrat_id, db)

    if user.id not in (contrat.bailleur_id, contrat.locataire_id):
        raise ContratError("Vous n'êtes pas partie à ce contrat", 403)

    if contrat.statut == StatutContrat.SIGNE:
        raise ContratError("Ce contrat est déjà signé", 400)

    # Vérifier l'OTP
    otp_result = await db.execute(
        select(OTPCode).where(
            OTPCode.user_id == user.id,
            OTPCode.purpose == OTPPurpose.DOCUMENT_SIGN,
            OTPCode.is_used == False,
        ).order_by(OTPCode.created_at.desc()).limit(1)
    )
    otp_record = otp_result.scalar_one_or_none()

    if not otp_record or not otp_record.is_valid:
        raise ContratError("Code OTP invalide ou expiré", 400)

    if not verify_hash(code_otp, otp_record.code_hash):
        otp_record.attempts += 1
        raise ContratError("Code OTP incorrect", 400)

    otp_record.is_used = True

    # Enregistrer la signature
    est_bailleur = user.id == contrat.bailleur_id
    if est_bailleur:
        contrat.signe_bailleur = True
    else:
        contrat.signe_locataire = True

    # Les deux parties ont signé → horodater et hasher
    if contrat.signe_bailleur and contrat.signe_locataire:
        now = datetime.now(timezone.utc)
        contrat.statut = StatutContrat.SIGNE
        contrat.horodatage = now

        # Hash SHA-256 du contrat comme preuve d'intégrité
        contrat_data = {
            "id": str(contrat.id),
            "annonce_id": str(contrat.annonce_id),
            "bailleur_id": str(contrat.bailleur_id),
            "locataire_id": str(contrat.locataire_id),
            "type_contrat": contrat.type_contrat,
            "montant_fcfa": contrat.montant_fcfa,
            "horodatage": now.isoformat(),
        }
        contrat.hash_sha256 = hashlib.sha256(
            json.dumps(contrat_data, sort_keys=True).encode()
        ).hexdigest()

    return contrat


# ═══════════════════════════════════════════════════════════════════════════════
# Litiges
# ═══════════════════════════════════════════════════════════════════════════════

async def declarer_litige(
    data: LitigeCreate,
    declarant: User,
    db: AsyncSession,
) -> LitigeFoncier:
    """Déclare un litige sur un contrat existant."""
    contrat = await get_contrat(data.contrat_id, db)

    if declarant.id not in (contrat.bailleur_id, contrat.locataire_id):
        raise ContratError("Vous n'êtes pas partie à ce contrat", 403)

    existing = await db.execute(
        select(LitigeFoncier).where(LitigeFoncier.contrat_id == data.contrat_id)
    )
    if existing.scalar_one_or_none():
        raise ContratError("Un litige existe déjà pour ce contrat", 409)

    litige = LitigeFoncier(
        contrat_id=data.contrat_id,
        declarant_id=declarant.id,
        description=data.description,
        statut=StatutLitige.OUVERT,
    )
    db.add(litige)
    await db.flush()
    await db.refresh(litige)
    return litige