"""
Service d'authentification AGRILYO — avec transactions explicites
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

class AuthError(Exception):
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

async def _get_user_by_phone(phone: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.phone_number == phone))
    return result.scalar_one_or_none()

async def _get_user_by_id(user_id: uuid.UUID, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def _invalidate_previous_otps(user_id: uuid.UUID, purpose: OTPPurpose, db: AsyncSession) -> None:
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

async def send_otp(phone_number: str, db: AsyncSession) -> SendOTPResponse:
    user = await _get_user_by_phone(phone_number, db)
    is_new_user = user is None

    if is_new_user:
        user = User(
            phone_number=phone_number,
            status=UserStatus.PENDING,
            roles=[UserRole.AGRICULTEUR.value],
        )
        db.add(user)
        await db.flush()
        logger.info(f"Nouvel utilisateur créé : {phone_number}")
    else:
        if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
            raise AccountSuspendedError()

    await _check_rate_limit(user.id, db)
    await _invalidate_previous_otps(user.id, OTPPurpose.LOGIN, db)

    otp_code = generate_otp()
    otp_record = OTPCode(
        user_id=user.id,
        code_hash=hash_value(otp_code),
        purpose=OTPPurpose.LOGIN,
        expires_at=get_otp_expiry(),
    )
    db.add(otp_record)
    await db.commit()  # ✅ Commit explicite

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

    if settings.is_development:
        # Toujours affiché dans le terminal en dev, que le code parte par SMS ou non
        logger.info(f"🔑 [DEV] Code OTP pour {phone_number} : {otp_code}")
        if settings.OTP_DEV_BYPASS:
            # En plus, renvoyé dans la réponse API pour pré-remplissage auto côté mobile
            response.debug_code = otp_code

    return response

async def verify_otp(
    phone_number: str,
    code: str,
    db: AsyncSession,
    first_name: str | None = None,
    last_name: str | None = None,
    region: str | None = None,
) -> AuthResponse:
    user = await _get_user_by_phone(phone_number, db)
    if not user:
        raise AuthError("Code invalide ou expiré.", status_code=400)

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise AccountSuspendedError()

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

    if otp_record.is_expired:
        raise ExpiredOTPError()

    otp_record.attempts += 1

    if not verify_hash(code, otp_record.code_hash):
        attempts_left = max(0, settings.OTP_MAX_ATTEMPTS - otp_record.attempts)
        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp_record.is_used = True
        await db.commit()  # ✅ Persiste le nombre de tentatives
        raise InvalidOTPError(attempts_left)

    otp_record.is_used = True
    is_new_user = user.status == UserStatus.PENDING

    user.status = UserStatus.ACTIVE
    user.phone_verified = True
    user.is_active = True
    user.last_login_at = datetime.now(timezone.utc)

    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
    if region:
        user.region = region

    access_token, refresh_token = _build_token_pair(user.id)
    user.refresh_token_hash = hash_value(refresh_token)

    await db.commit()  # ✅ Commit explicite de toute la transaction
    await db.refresh(user)

    logger.info(
        f"Connexion réussie : {phone_number} "
        f"({'nouveau compte' if is_new_user else 'compte existant'})"
    )

    return AuthResponse(
        tokens=_token_pair_schema(access_token, refresh_token),
        user=UserPublicSchema.model_validate(user),
        is_new_user=is_new_user,
        requires_password_setup=user.password_hash is None,
    )


async def set_password(user: User, password: str, db: AsyncSession) -> None:
    """
    Définit (ou remplace) le mot de passe de l'utilisateur.
    Appelé juste après la première vérification OTP réussie (endpoint protégé).
    """
    user.password_hash = hash_value(password)
    await db.commit()
    logger.info(f"Mot de passe défini : {user.phone_number}")


async def login_with_password(phone_number: str, password: str, db: AsyncSession) -> AuthResponse:
    """
    Connexion par numéro + mot de passe — flow utilisé une fois le mot de passe créé,
    plus besoin de repasser par l'OTP.
    """
    user = await _get_user_by_phone(phone_number, db)

    # Message volontairement générique (numéro OU mot de passe) — évite d'indiquer
    # à un attaquant si le numéro existe en base.
    generic_error = AuthError("Numéro ou mot de passe incorrect.", status_code=400)

    if not user or not user.password_hash:
        raise generic_error

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise AccountSuspendedError()

    if not verify_hash(password, user.password_hash):
        raise generic_error

    access_token, refresh_token = _build_token_pair(user.id)
    user.refresh_token_hash = hash_value(refresh_token)
    user.last_login_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)

    logger.info(f"Connexion par mot de passe réussie : {phone_number}")

    return AuthResponse(
        tokens=_token_pair_schema(access_token, refresh_token),
        user=UserPublicSchema.model_validate(user),
        is_new_user=False,
        requires_password_setup=False,
    )

async def refresh_tokens(refresh_token: str, db: AsyncSession) -> TokenPairSchema:
    user_id_str = verify_token(refresh_token, token_type="refresh")
    if not user_id_str:
        raise AuthError("Token de rafraîchissement invalide ou expiré.", status_code=401)

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthError("Token invalide.", status_code=401)

    user = await _get_user_by_id(user_id, db)
    if not user or not user.is_active:
        raise AuthError("Compte introuvable ou inactif.", status_code=401)

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise AccountSuspendedError()

    if not user.refresh_token_hash or not verify_hash(refresh_token, user.refresh_token_hash):
        raise AuthError("Token de rafraîchissement révoqué. Reconnectez-vous.", status_code=401)

    access_token, new_refresh_token = _build_token_pair(user.id)
    user.refresh_token_hash = hash_value(new_refresh_token)
    user.last_login_at = datetime.now(timezone.utc)

    await db.commit()  # ✅ Commit explicite
    await db.refresh(user)

    logger.debug(f"Tokens rafraîchis pour user {user.id}")

    return _token_pair_schema(access_token, new_refresh_token)

async def logout(user: User, db: AsyncSession) -> None:
    user.refresh_token_hash = None
    await db.commit()  # ✅ Commit explicite
    logger.info(f"Déconnexion : {user.phone_number}")

async def get_current_user(token: str, db: AsyncSession) -> User:
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