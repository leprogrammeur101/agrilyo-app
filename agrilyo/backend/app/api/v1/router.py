"""
Routeur principal API v1 — AGRILYO
Agrège tous les sous-routeurs des modules.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health
from app.api.v1.endpoints import auth     # Sprint 1
from app.api.v1.endpoints import foncier  # Sprint 2
from app.api.v1.endpoints import contrat  # Sprint 3

# Sprint 2+ : décommenter au fur et à mesure
# from app.api.v1.endpoints import foncier
# from app.api.v1.endpoints import semences
# from app.api.v1.endpoints import conseil

api_router = APIRouter()

# ── Monitoring ────────────────────────────────────────────────────────────────
api_router.include_router(health.router, prefix="", tags=["Monitoring"])

# ── Sprint 1 — Auth ───────────────────────────────────────────────────────────
api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])
api_router.include_router(foncier.router, prefix="/foncier/annonces", tags=["M1 Foncier"])
api_router.include_router(contrat.router, prefix="/foncier", tags=["M1 Contrats & Messagerie"])

# ── Sprint 2/3 — Foncier ──────────────────────────────────────────────────────
# api_router.include_router(foncier.router, prefix="/foncier", tags=["M1 Foncier"])

# ── Sprint 4/5 — Semences ─────────────────────────────────────────────────────
# api_router.include_router(semences.router, prefix="/semences", tags=["M2 Semences"])

# ── Sprint 6/7 — Conseil ──────────────────────────────────────────────────────
# api_router.include_router(conseil.router, prefix="/conseil", tags=["M3 Conseil"])