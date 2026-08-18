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

from fastapi import APIRouter, Depends, File, HTTPException, Security, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import UserRole
from app.schemas.auth import (
    AuthResponse,
    CompleteProfileRequest,
    PasswordLoginRequest,
    RefreshTokenRequest,
    SendOTPRequest,
    SendOTPResponse,
    SetPasswordRequest,
    SetPasswordResponse,
    TokenPairSchema,
    UpdateProfileRequest,
    UserPublicSchema,
)
from app.services.auth_service import (
    AccountSuspendedError,
    AuthError,
    complete_profile,
    get_current_user,
    login_with_password,
    logout,
    refresh_tokens,
    send_otp,
    set_password,
    update_avatar,
    update_profile,
    verify_otp,
)
from app.services.storage_service import upload_image_to_r2
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


async def require_admin(current_user=Depends(get_authenticated_user)):
    """
    Dependency FastAPI pour les routes réservées aux administrateurs.
    Usage : `current_user = Depends(require_admin)` — remplace le pattern
    `Depends(get_authenticated_user)` + vérification manuelle du rôle qui
    était dupliqué dans plusieurs fichiers d'endpoints.
    """
    if not current_user.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Action réservée aux administrateurs")
    return current_user


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


@router.post(
    "/login-password",
    response_model=AuthResponse,
    summary="Connexion par numéro + mot de passe",
    description=(
        "Utilisé une fois que l'utilisateur a défini son mot de passe "
        "(voir /auth/set-password). Remplace l'OTP pour les connexions suivantes."
    ),
)
async def login_password_endpoint(
    body: PasswordLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    try:
        return await login_with_password(
            phone_number=body.phone_number, password=body.password, db=db
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ═══════════════════════════════════════════════════════════════════════════════
# Routes protégées (Bearer token requis)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/set-password",
    response_model=SetPasswordResponse,
    summary="Créer son mot de passe",
    description=(
        "Étape 3, une seule fois, juste après la première vérification OTP "
        "(`requires_password_setup=true` dans la réponse de /verify-otp). "
        "Nécessite le token obtenu via /verify-otp."
    ),
)
async def set_password_endpoint(
    body: SetPasswordRequest,
    current_user=Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> SetPasswordResponse:
    await set_password(user=current_user, password=body.password, db=db)
    return SetPasswordResponse(success=True, message="Mot de passe créé avec succès.")


@router.post(
    "/complete-profile",
    response_model=UserPublicSchema,
    summary="Choisir son/ses rôle(s) et compléter son profil",
    description=(
        "Étape affichée une seule fois, juste après la première vérification OTP "
        "(`requires_role_setup=true` dans la réponse de /verify-otp). "
        "Remplace le rôle par défaut par la sélection de l'utilisateur et "
        "crée les profils métier associés si besoin (Agronome, Fournisseur)."
    ),
)
async def complete_profile_endpoint(
    body: CompleteProfileRequest,
    current_user=Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> UserPublicSchema:
    return await complete_profile(user=current_user, data=body, db=db)


@router.patch(
    "/me",
    response_model=UserPublicSchema,
    summary="Modifier son profil",
    description="Mise à jour partielle du profil connecté (tous les champs sont optionnels).",
)
async def update_me_endpoint(
    body: UpdateProfileRequest,
    current_user=Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> UserPublicSchema:
    return await update_profile(user=current_user, data=body, db=db)


@router.post(
    "/me/avatar",
    response_model=UserPublicSchema,
    summary="Uploader sa photo de profil",
)
async def upload_avatar_endpoint(
    file: UploadFile = File(...),
    current_user=Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_db),
) -> UserPublicSchema:
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.",
        )
    try:
        upload_result = await upload_image_to_r2(
            file_stream=file.file,
            filename=file.filename or "avatar.jpg",
            content_type=file.content_type,
            prefix="avatars",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return await update_avatar(user=current_user, avatar_url=upload_result["url"], db=db)


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