"""
Endpoints Sprint 3 — Contrats, Messagerie, Litiges AGRILYO
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.contrat import (
    ContratCreate, ContratResponse,
    LitigeCreate, LitigeResponse,
    MessageCreate, MessageResponse,
    SignatureRequest, SignatureResponse,
    ThreadCreate, ThreadResponse, ThreadResume,
)
from app.services.contrat_service import (
    ContratError,
    creer_contrat, creer_thread, declarer_litige,
    demander_otp_signature, envoyer_message,
    get_contrat, get_thread, mes_threads, signer_contrat,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════════
# Messagerie
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/threads",
    summary="Mes conversations",
    description="Retourne tous les threads de l'utilisateur connecté.",
)
async def mes_threads_endpoint(
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    threads = await mes_threads(user=current_user, db=db)
    result = []
    for t in threads:
        dernier = t.messages[-1].contenu[:80] if t.messages else None
        non_lus = sum(
            1 for m in t.messages
            if m.auteur_id != current_user.id and not m.lu
        )
        result.append({
            "id": str(t.id),
            "annonce_id": str(t.annonce_id),
            "est_actif": t.est_actif,
            "updated_at": t.updated_at,
            "dernier_message": dernier,
            "messages_non_lus": non_lus,
            "annonce_region": t.annonce.region if t.annonce else None,
            "annonce_superficie": t.annonce.superficie_ha if t.annonce else None,
        })
    return result


@router.post(
    "/threads",
    status_code=201,
    summary="Ouvrir une conversation avec un bailleur",
)
async def creer_thread_endpoint(
    data: ThreadCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        thread = await creer_thread(data=data, demandeur=current_user, db=db)
        return {"id": str(thread.id), "annonce_id": str(thread.annonce_id)}
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/threads/{thread_id}",
    summary="Détail d'une conversation",
)
async def get_thread_endpoint(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        thread = await get_thread(thread_id=thread_id, user=current_user, db=db)
        messages = []
        for m in thread.messages:
            nom = (
                m.auteur.display_name or
                f"{m.auteur.first_name or ''} {m.auteur.last_name or ''}".strip() or
                m.auteur.phone_number
            )
            messages.append({
                "id": str(m.id),
                "auteur_id": str(m.auteur_id),
                "auteur_nom": nom,
                "contenu": m.contenu,
                "lu": m.lu,
                "created_at": m.created_at,
                "est_moi": m.auteur_id == current_user.id,
            })
        return {
            "id": str(thread.id),
            "annonce_id": str(thread.annonce_id),
            "demandeur_id": str(thread.demandeur_id),
            "bailleur_id": str(thread.annonce.bailleur_id),
            "est_actif": thread.est_actif,
            "messages": messages,
        }
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/threads/{thread_id}/messages",
    status_code=201,
    summary="Envoyer un message",
)
async def envoyer_message_endpoint(
    thread_id: uuid.UUID,
    data: MessageCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        message = await envoyer_message(
            thread_id=thread_id, data=data, auteur=current_user, db=db
        )
        return {
            "id": str(message.id),
            "contenu": message.contenu,
            "created_at": message.created_at,
        }
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Contrats
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/contrats",
    status_code=201,
    response_model=ContratResponse,
    summary="Créer un brouillon de contrat",
    description="Seul le bailleur peut initier un contrat sur son annonce.",
)
async def creer_contrat_endpoint(
    data: ContratCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> ContratResponse:
    try:
        contrat = await creer_contrat(data=data, bailleur=current_user, db=db)
        return ContratResponse.model_validate(contrat)
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/contrats/{contrat_id}",
    response_model=ContratResponse,
    summary="Détail d'un contrat",
)
async def get_contrat_endpoint(
    contrat_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> ContratResponse:
    try:
        contrat = await get_contrat(contrat_id=contrat_id, db=db)
        if current_user.id not in (contrat.bailleur_id, contrat.locataire_id):
            raise HTTPException(status_code=403, detail="Accès refusé")
        return ContratResponse.model_validate(contrat)
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/contrats/{contrat_id}/demander-otp",
    summary="Demander un OTP pour signer le contrat",
    description="Envoie un code OTP par SMS pour autoriser la signature.",
)
async def demander_otp_endpoint(
    contrat_id: uuid.UUID,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        debug_code = await demander_otp_signature(
            contrat_id=contrat_id, user=current_user, db=db
        )
        response = {"message": "Code OTP envoyé par SMS", "success": True}
        # En dev uniquement
        from app.core.config import settings
        if settings.is_development and settings.OTP_DEV_BYPASS:
            response["debug_code"] = debug_code
        return response
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/contrats/{contrat_id}/signer",
    summary="Signer le contrat avec OTP",
    description=(
        "Valide la signature avec le code OTP reçu. "
        "Quand les deux parties ont signé : horodatage + hash SHA-256 généré."
    ),
)
async def signer_contrat_endpoint(
    contrat_id: uuid.UUID,
    data: SignatureRequest,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        contrat = await signer_contrat(
            contrat_id=contrat_id, code_otp=data.code_otp,
            user=current_user, db=db,
        )
        est_complet = contrat.signe_bailleur and contrat.signe_locataire
        return {
            "contrat": ContratResponse.model_validate(contrat),
            "hash_sha256": contrat.hash_sha256,
            "horodatage": contrat.horodatage,
            "est_completement_signe": est_complet,
            "message": (
                "Contrat signé par les deux parties. Horodatage effectué."
                if est_complet
                else "Signature enregistrée. En attente de l'autre partie."
            ),
        }
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Litiges
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/litiges",
    status_code=201,
    response_model=LitigeResponse,
    summary="Déclarer un litige",
    description="Ouvre un dossier de médiation sur un contrat signé.",
)
async def declarer_litige_endpoint(
    data: LitigeCreate,
    current_user: User = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> LitigeResponse:
    try:
        litige = await declarer_litige(
            data=data, declarant=current_user, db=db
        )
        return LitigeResponse.model_validate(litige)
    except ContratError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)