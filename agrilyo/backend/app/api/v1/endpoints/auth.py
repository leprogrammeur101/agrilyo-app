"""
Endpoints d'authentification AGRILYO — Sprint 1
Routes : SendOTP · VerifyOTP · Refresh · Logout · Me

Flux d'appel :
  POST /auth/send-otp     → reçoit le numéro, envoie un SMS OTP
  POST /auth/verify-otp   → vérifie le code, retourne access + refresh token
  POST /auth/refresh      → renouvelle la paire de tokens
  POST /auth/logout       → révoque le refresh token (endpoint protégé)
  GET  /auth/me           → profil de l'utilisateur connecté (endpoint protégé)
"""

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    AuthResponse,
    RefreshTokenRequest,
    SendOTPRequest,
    SendOTPResponse,
    TokenPairSchema,
    UserPublicSchema,
)
from app.services.auth_service import (
    AccountSuspendedError,
    AuthError,
    get_current_user,
    logout,
    refresh_tokens,
    send_otp,
    verify_otp,
)
from app.schemas.auth import VerifyOTPRequest

router = APIRouter()

# ── Schéma de sécurité Bearer — utilisé par Swagger UI ───────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


# ── Dependency : utilisateur courant ─────────────────────────────────────────

async def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency FastAPI pour les routes protégées.
    Extrait le token Bearer du header Authorization et retourne le User.
    Usage : `current_user = Depends(get_authenticated_user)`
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Token d'authentification manquant.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return await get_current_user(credentials.credentials, db)
    except AuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Routes publiques (pas de token requis)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/send-otp",
    response_model=SendOTPResponse,
    summary="Envoyer un code OTP par SMS",
    description=(
        "Étape 1 de l'authentification. Envoie un code à 6 chiffres "
        "par SMS au numéro ivoirien fourni. "
        "Crée le compte automatiquement si c'est un nouveau numéro. "
        "**Dev** : le code est retourné dans `debug_code` si `OTP_DEV_BYPASS=true`."
    ),
)
async def send_otp_endpoint(
    body: SendOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> SendOTPResponse:
    try:
        return await send_otp(phone_number=body.phone_number, db=db)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/verify-otp",
    response_model=AuthResponse,
    summary="Vérifier le code OTP et obtenir les tokens JWT",
    description=(
        "Étape 2 de l'authentification. Vérifie le code reçu par SMS. "
        "Si correct, retourne une paire `access_token` / `refresh_token` "
        "et le profil utilisateur. "
        "`is_new_user=true` indique que c'est la première connexion "
        "(→ afficher l'écran d'onboarding côté mobile)."
    ),
)
async def verify_otp_endpoint(
    body: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    try:
        return await verify_otp(
            phone_number=body.phone_number,
            code=body.code,
            db=db,
            first_name=body.first_name,
            last_name=body.last_name,
            region=body.region,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/refresh",
    response_model=TokenPairSchema,
    summary="Renouveler la paire de tokens JWT",
    description=(
        "Échange un `refresh_token` valide contre une nouvelle paire "
        "`access_token` / `refresh_token`. "
        "L'ancien refresh token est immédiatement révoqué (rotation)."
    ),
)
async def refresh_endpoint(
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenPairSchema:
    try:
        return await refresh_tokens(refresh_token=body.refresh_token, db=db)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Routes protégées (Bearer token requis)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/logout",
    status_code=204,
    summary="Déconnecter l'utilisateur",
    description=(
        "Révoque le refresh token en base. "
        "Après cet appel, toute tentative de `/refresh` échouera. "
        "L'access token reste valide jusqu'à son expiration naturelle (15 min)."
    ),
)
async def logout_endpoint(
    current_user=Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await logout(user=current_user, db=db)


@router.get(
    "/me",
    response_model=UserPublicSchema,
    summary="Profil de l'utilisateur connecté",
    description="Retourne le profil complet de l'utilisateur authentifié.",
)
async def me_endpoint(
    current_user=Depends(get_authenticated_user),
) -> UserPublicSchema:
    return UserPublicSchema.model_validate(current_user)