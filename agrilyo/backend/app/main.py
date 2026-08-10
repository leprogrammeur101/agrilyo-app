"""
AGRILYO API — FastAPI Application Entry Point (corrigé)
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import check_db_connection, engine

# ── Config logging — sans ça, logger.info()/logger.debug() ne s'affichent
#    jamais dans le terminal (niveau racine par défaut = WARNING) ────────────
logging.basicConfig(
    level=logging.DEBUG if settings.is_development else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)

# ── Rate limiting en mémoire (simple, remplacer par Redis en production) ─────
_request_counts: dict[str, list[float]] = {}

def _is_rate_limited(client_ip: str, limit: int = 60, window: int = 60) -> bool:
    now = time.time()
    timestamps = _request_counts.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < window]
    _request_counts[client_ip] = timestamps
    if len(timestamps) >= limit:
        return True
    timestamps.append(now)
    return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AGRILYO API démarrée — v%s", settings.APP_VERSION)
    db_ok = await check_db_connection()
    if not db_ok:
        logger.error("❌ Connexion PostgreSQL échouée")
    else:
        logger.info("✅ Connexion PostgreSQL OK")
    yield
    logger.info("AGRILYO API arrêtée")
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API AGRILYO — Plateforme agricole intégrée Côte d'Ivoire",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── CORS — restriction aux origines configurées ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
    max_age=600,
)

# ── Middleware rate limiting global ──────────────────────────────────────────
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if _is_rate_limited(client_ip, limit=settings.RATE_LIMIT_API_PER_MINUTE, window=60):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Trop de requêtes. Veuillez réessayer dans une minute."},
        )
    return await call_next(request)

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Système"])
async def health_check():
    db_ok = await check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_ok else "disconnected",
    }

app.include_router(api_router, prefix="/api/v1")