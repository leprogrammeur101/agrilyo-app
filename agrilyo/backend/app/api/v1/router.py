"""
Routeur principal API v1 — AGRILYO
Agrège tous les sous-routeurs des modules.

Sprints terminés :
  Sprint 1 — Auth (OTP, JWT, refresh, logout, me)
  Sprint 2 — M1 Foncier : annonces
  Sprint 3 — M1 Foncier : contrats, messagerie, litiges

À venir :
  Sprint 4 — M2 Semences (fournisseurs, produits, commandes)
  Sprint 5 — M3 Conseil (agronomes, sessions, plannings)
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health
from app.api.v1.endpoints import auth     # Sprint 1
from app.api.v1.endpoints import foncier  # Sprint 2
from app.api.v1.endpoints import contrat  # Sprint 3
from app.api.v1.endpoints import semences  # Sprint 4

# Sprints futurs — décommenter au moment du développement
# from app.api.v1.endpoints import conseil   # Sprint 5

api_router = APIRouter()

# ── Monitoring ────────────────────────────────────────────────────────────────
api_router.include_router(health.router, prefix="", tags=["Monitoring"])

# ── Sprint 1 — Authentification ───────────────────────────────────────────────
api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])

# ── Sprint 2 — M1 Foncier : annonces ─────────────────────────────────────────
api_router.include_router(foncier.router, prefix="/foncier/annonces", tags=["M1 Foncier"])

# ── Sprint 3 — M1 Foncier : contrats, messagerie, litiges ────────────────────
api_router.include_router(contrat.router, prefix="/foncier", tags=["M1 Contrats & Messagerie"])

# ── Sprint 4 — M2 Semences ────────────────────────────────────────────────────
api_router.include_router(semences.router, prefix="/semences", tags=["M2 Semences"])

# ── Sprint 5 — M3 Conseil ─────────────────────────────────────────────────────
# api_router.include_router(conseil.router, prefix="/conseil", tags=["M3 Conseil"])
