# Centralise tous les modèles pour qu'Alembic les détecte automatiquement.
# Importer ici chaque nouveau modèle créé.

from app.models.user import User, UserRole, UserStatus  # noqa: F401
from app.models.otp import OTPCode, OTPPurpose           # noqa: F401

# Sprint 2 — Foncier
from app.models.foncier import (  # noqa: F401
    AnnonceFonciere, DocumentFoncier,
    ThreadFoncier, MessageFoncier,
    ContratFoncier, LitigeFoncier,
)
from app.models.semences import (  # noqa: F401
    FournisseurSemences, ProduitSemences, PhotoProduit,
    CertificationProduit, AvisProduit,
)
# from app.models.conseil import Agronome, DemandeConseil, SessionConseil, Planning  # noqa