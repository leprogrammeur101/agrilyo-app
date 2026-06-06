"""
Point d'entrée principal de l'API AGRILYO — FastAPI
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.is_development else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application."""
    logger.info(f"🌱 AGRILYO API démarrage — environnement : {settings.ENVIRONMENT}")
    logger.info(f"📖 Documentation : /docs")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("🔴 AGRILYO API arrêt propre")


# ── Application FastAPI ────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST d'AGRILYO — Plateforme agricole de Côte d'Ivoire.\n\n"
        "**Modules Phase 1 :** M1 Foncier · M2 Semences · M3 Conseil\n\n"
        "**Auth :** Numéro de téléphone CI + OTP SMS → JWT\n\n"
        "**Paiement :** CinetPay (Orange Money, MTN MoMo, Wave CI)"
    ),
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    redirect_slashes=False,   # ← AJOUTER cette ligne

    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ── Handlers d'erreurs globaux ────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Ressource introuvable", "path": str(request.url.path)},
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Erreur interne : {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur. Notre équipe a été notifiée."},
    )