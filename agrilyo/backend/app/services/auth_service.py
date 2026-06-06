"""
Service d'authentification AGRILYO — Sprint 1
Logique métier complète : SendOTP · VerifyOTP · Refresh · Logout

Flux complet :
  1. send_otp()    → crée/récupère User, génère OTP, l'hash, le stocke, envoie SMS
  2. verify_otp()  → vérifie hash, active le compte, émet la paire JWT
  3. refresh()     → vérifie refresh token, émet une nouvelle paire
  4. logout()      → invalide le refresh token en base
"""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_otp,
    get_otp_expiry,
    hash_value,
    verify_hash,
    verify_token,
)
from app.models.otp import OTPCode, OTPPurpose
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import AuthResponse, SendOTPResponse, TokenPairSchema, UserPublicSchema
from app.services.sms_service import send_otp_sms

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# Exceptions métier — capturées proprement dans les endpoints
# ═══════════════════════════════════════════════════════════════════════════════

class AuthError(Exception):
    """Erreur d'authentification avec un message localisé pour l'utilisateur."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class RateLimitError(AuthError):
    def __init__(self):
        super().__init__(
            "Trop de tentatives. Attendez quelques minutes avant de réessayer.",
            status_code=429,
        )


class InvalidOTPError(AuthError):
    def __init__(self, attempts_left: int):
        msg = (
            f"Code incorrect. Il vous reste {attempts_left} tentative(s)."
            if attempts_left > 0
            else "Code incorrect. Ce code est maintenant bloqué. Demandez un nouveau code."
        )
        super().__init__(msg, status_code=400)


class ExpiredOTPError(AuthError):
    def __init__(self):
        super().__init__("Ce code a expiré. Demandez un nouveau code.", status_code=400)


class AccountSuspendedError(AuthError):
    def __init__(self):
        super().__init__(
            "Ce compte est suspendu. Contactez le support AGRILYO.", status_code=403
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers internes
# ═══════════════════════════════════════════════════════════════════════════════

async def _get_user_by_phone(phone: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.phone_number == phone))
    return result.scalar_one_or_none()


async def _get_user_by_id(user_id: uuid.UUID, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def _invalidate_previous_otps(user_id: uuid.UUID, purpose: OTPPurpose, db: AsyncSession) -> None:
    """Marque comme utilisés tous les OTP actifs de cet utilisateur pour ce purpose."""
    await db.execute(
        update(OTPCode)
        .where(
            and_(
                OTPCode.user_id == user_id,
                OTPCode.purpose == purpose,
                OTPCode.is_used == False,  # noqa: E712
            )
        )
        .values(is_used=True)
    )


async def _check_rate_limit(user_id: uuid.UUID, db: AsyncSession) -> None:
    """
    Vérifie que l'utilisateur n'a pas demandé plus de N OTP dans la dernière heure.
    Compte les OTP créés (même utilisés) dans la fenêtre glissante.
    """
    from datetime import timedelta
    from sqlalchemy import func

    window_start = datetime.now(timezone.utc) - timedelta(hours=1)
    result = await db.execute(
        select(func.count(OTPCode.id)).where(
            and_(
                OTPCode.user_id == user_id,
                OTPCode.created_at >= window_start,
            )
        )
    )
    count = result.scalar_one()
    if count >= settings.RATE_LIMIT_OTP_PER_HOUR:
        raise RateLimitError()


def _build_token_pair(user_id: uuid.UUID) -> tuple[str, str]:
    """Génère la paire (access_token, refresh_token) pour un user."""
    access = create_access_token(str(user_id))
    refresh = create_refresh_token(str(user_id))
    return access, refresh


def _token_pair_schema(access: str, refresh: str) -> TokenPairSchema:
    return TokenPairSchema(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# API publique du service
# ═══════════════════════════════════════════════════════════════════════════════

async def send_otp(phone_number: str, db: AsyncSession) -> SendOTPResponse:
    """
    Étape 1 de l'auth — Envoi de l'OTP par SMS.

    Comportement :
    - Si le numéro est inconnu → crée un User en statut PENDING
    - Si le compte est suspendu/banni → refuse immédiatement
    - Vérifie le rate limit (max N OTP/heure)
    - Invalide les OTP actifs précédents
    - Génère un nouvel OTP, le hache et le stocke
    - Envoie le SMS via Africa's Talking
    """
    # 1. Récupérer ou créer l'utilisateur
    user = await _get_user_by_phone(phone_number, db)
    is_new_user = user is None

    if is_new_user:
        user = User(
            phone_number=phone_number,
            status=UserStatus.PENDING,
            roles=[UserRole.AGRICULTEUR.value],  # rôle par défaut
        )
        db.add(user)
        await db.flush()  # pour avoir l'UUID avant le commit
        logger.info(f"Nouvel utilisateur créé : {phone_number}")
    else:
        # Vérifier que le compte est accessible
        if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
            raise AccountSuspendedError()

    # 2. Rate limiting
    await _check_rate_limit(user.id, db)

    # 3. Invalider les OTP précédents
    await _invalidate_previous_otps(user.id, OTPPurpose.LOGIN, db)

    # 4. Générer le nouvel OTP
    otp_code = generate_otp()
    otp_record = OTPCode(
        user_id=user.id,
        code_hash=hash_value(otp_code),
        purpose=OTPPurpose.LOGIN,
        expires_at=get_otp_expiry(),
    )
    db.add(otp_record)
    # Le commit final est géré par la dependency get_db()

    # 5. Envoyer le SMS (ne bloque pas l'enregistrement en base)
    sms_sent = await send_otp_sms(
        phone_number=phone_number,
        otp_code=otp_code,
        language=user.language if not is_new_user else "fr",
    )

    if not sms_sent:
        logger.warning(f"SMS non envoyé pour {phone_number}, mais OTP créé en base")

    response = SendOTPResponse(
        success=True,
        message=(
            f"Code envoyé par SMS au {phone_number}. "
            f"Valable {settings.OTP_EXPIRE_MINUTES} minutes."
        ),
    )

    # En développement uniquement : retourner le code en clair pour les tests
    if settings.is_development and settings.OTP_DEV_BYPASS:
        response.debug_code = otp_code
        logger.debug(f"[DEV] OTP pour {phone_number} : {otp_code}")

    return response


async def verify_otp(
    phone_number: str,
    code: str,
    db: AsyncSession,
    first_name: str | None = None,
    last_name: str | None = None,
    region: str | None = None,
) -> AuthResponse:
    """
    Étape 2 de l'auth — Vérification du code OTP et émission des JWT.

    Comportement :
    - Cherche le dernier OTP valide (non utilisé, non expiré) pour ce numéro
    - Incrémente le compteur de tentatives à chaque appel (même si KO)
    - Vérifie le hash bcrypt du code fourni
    - Active le compte si c'était un PENDING (première connexion)
    - Émet une paire JWT et stocke le hash du refresh token
    - Retourne is_new_user=True si c'est la première connexion (→ onboarding mobile)
    """
    # 1. Trouver l'utilisateur
    user = await _get_user_by_phone(phone_number, db)
    if not user:
        # Ne pas révéler que le numéro n'existe pas
        raise AuthError("Code invalide ou expiré.", status_code=400)

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise AccountSuspendedError()

    # 2. Trouver le dernier OTP actif pour cet utilisateur
    result = await db.execute(
        select(OTPCode)
        .where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.purpose == OTPPurpose.LOGIN,
                OTPCode.is_used == False,  # noqa: E712
            )
        )
        .order_by(OTPCode.created_at.desc())
        .limit(1)
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise AuthError("Aucun code actif trouvé. Demandez un nouveau code.", status_code=400)

    # 3. Vérifier l'expiration avant d'incrémenter les tentatives
    if otp_record.is_expired:
        raise ExpiredOTPError()

    # 4. Incrémenter le compteur de tentatives
    otp_record.attempts += 1

    # 5. Vérifier le code
    if not verify_hash(code, otp_record.code_hash):
        attempts_left = max(0, settings.OTP_MAX_ATTEMPTS - otp_record.attempts)
        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp_record.is_used = True  # bloquer définitivement cet OTP
        raise InvalidOTPError(attempts_left)

    # 6. OTP valide → marquer comme utilisé
    otp_record.is_used = True

    # 7. Déterminer si c'est la première connexion
    is_new_user = user.status == UserStatus.PENDING

    # 8. Activer le compte et mettre à jour le profil
    user.status = UserStatus.ACTIVE
    user.phone_verified = True
    user.is_active = True
    user.last_login_at = datetime.now(timezone.utc)

    # Compléter le profil si fourni (premier login / onboarding)
    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
    if region:
        user.region = region

    # 9. Émettre la paire JWT
    access_token, refresh_token = _build_token_pair(user.id)

    # Stocker le hash du refresh token pour permettre la révocation
    user.refresh_token_hash = hash_value(refresh_token)

    logger.info(
        f"Connexion réussie : {phone_number} "
        f"({'nouveau compte' if is_new_user else 'compte existant'})"
    )

    return AuthResponse(
        tokens=_token_pair_schema(access_token, refresh_token),
        user=UserPublicSchema.model_validate(user),
        is_new_user=is_new_user,
    )


async def refresh_tokens(refresh_token: str, db: AsyncSession) -> TokenPairSchema:
    """
    Renouvelle la paire JWT à partir d'un refresh token valide.

    Comportement :
    - Vérifie la signature JWT et le type "refresh"
    - Récupère l'utilisateur et compare le hash stocké en base
    - Si valide → émet une nouvelle paire et met à jour le hash
    - Rotation de refresh token : l'ancien est immédiatement invalidé
    """
    # 1. Vérifier la signature JWT
    user_id_str = verify_token(refresh_token, token_type="refresh")
    if not user_id_str:
        raise AuthError("Token de rafraîchissement invalide ou expiré.", status_code=401)

    # 2. Récupérer l'utilisateur
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthError("Token invalide.", status_code=401)

    user = await _get_user_by_id(user_id, db)
    if not user or not user.is_active:
        raise AuthError("Compte introuvable ou inactif.", status_code=401)

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise AccountSuspendedError()

    # 3. Vérifier que le refresh token correspond bien à celui stocké en base
    # (défense contre la réutilisation d'anciens tokens après logout)
    if not user.refresh_token_hash or not verify_hash(refresh_token, user.refresh_token_hash):
        raise AuthError("Token de rafraîchissement révoqué. Reconnectez-vous.", status_code=401)

    # 4. Rotation : générer une nouvelle paire
    access_token, new_refresh_token = _build_token_pair(user.id)
    user.refresh_token_hash = hash_value(new_refresh_token)
    user.last_login_at = datetime.now(timezone.utc)

    logger.debug(f"Tokens rafraîchis pour user {user.id}")

    return _token_pair_schema(access_token, new_refresh_token)


async def logout(user: User, db: AsyncSession) -> None:
    """
    Déconnexion — invalide le refresh token en base.
    Après cet appel, toute tentative de refresh échouera.
    """
    user.refresh_token_hash = None
    logger.info(f"Déconnexion : {user.phone_number}")


async def get_current_user(token: str, db: AsyncSession) -> User:
    """
    Dependency helper — décode le JWT et retourne l'utilisateur actif.
    Utilisé dans les endpoints protégés via Depends().
    Lève AuthError(401) si le token est invalide ou l'utilisateur inactif.
    """
    user_id_str = verify_token(token, token_type="access")
    if not user_id_str:
        raise AuthError("Token d'accès invalide ou expiré.", status_code=401)

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthError("Token invalide.", status_code=401)

    user = await _get_user_by_id(user_id, db)
    if not user or not user.is_active:
        raise AuthError("Compte introuvable ou désactivé.", status_code=401)

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise AccountSuspendedError()

    return user