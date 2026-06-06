# AGRILYO — Contexte développement (CLAUDE.md)

> Fichier de référence pour les sessions Claude Code.
> Mis à jour : Avril 2026 | Stack : React Native + FastAPI + PostgreSQL

---

## Projet

**AGRILYO** — Plateforme agricole de Côte d'Ivoire (anciennement AGRO-CI).
Trois piliers MVP Phase 1 : **M1 Foncier · M2 Semences · M3 Conseil**.
Dev solo. Déploiement Railway.

---

## Structure du repo

```
agrilyo/
├── backend/          # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── core/     # config.py, database.py, security.py
│   │   ├── models/   # SQLAlchemy ORM (User, OTPCode, ...)
│   │   ├── schemas/  # Pydantic v2 (validation I/O)
│   │   ├── api/v1/   # Endpoints FastAPI par module
│   │   └── services/ # Logique métier, SMS, paiement, stockage
│   ├── alembic/      # Migrations DB
│   └── tests/        # pytest-asyncio
└── mobile/           # React Native + Expo SDK 51
    ├── app/
    │   ├── (auth)/   # login.tsx, verify-otp.tsx
    │   └── (tabs)/   # index.tsx, foncier.tsx, semences.tsx, conseil.tsx
    ├── api/          # client.ts (Axios+JWT), auth.api.ts, ...
    ├── store/        # Zustand stores
    └── constants/    # colors.ts, theme.ts
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo SDK 51, Expo Router v3 |
| State | Zustand + TanStack React Query |
| Backend | FastAPI + Python 3.12, SQLAlchemy 2.0 async |
| Base de données | PostgreSQL 15+ (asyncpg) |
| Migrations | Alembic |
| Auth | OTP SMS (Africa's Talking) + JWT (python-jose) |
| Paiement | CinetPay (Orange Money, MTN MoMo, Wave CI) |
| SMS / USSD | Africa's Talking |
| Push | Firebase FCM |
| Stockage | Cloudflare R2 (compatible S3, boto3) |
| Hébergement | Railway.app |
| Tâches async | Celery + Redis |

---

## Conventions de code

### Backend Python
- **Async partout** : toutes les routes et services sont `async def`
- **Type hints** : obligatoires sur toutes les fonctions
- **Schémas Pydantic** séparés des modèles SQLAlchemy
- **Services** : la logique métier va dans `app/services/`, pas dans les routes
- Convention nommage : `snake_case` Python, `PascalCase` pour les classes
- Chaque module a ses propres modèles dans `app/models/<module>.py`
- Importer les modèles dans `app/models/__init__.py` pour qu'Alembic les détecte

### Mobile TypeScript
- **Expo Router** : navigation par fichiers dans `app/`
- Appels API centralisés dans `api/<module>.api.ts`
- Un seul store Zustand par domaine (`auth.store.ts`, `foncier.store.ts`, etc.)
- Styles : `StyleSheet.create` uniquement (pas d'inline styles)
- Couleurs : toujours depuis `constants/colors.ts`
- Typographie : toujours `FontFamily.*` depuis `constants/theme.ts`

---

## Couleurs AGRILYO

```
vertForet:  #1A4D2E  ← primaire, headers, CTA
vertSavane: #2D7A4F  ← secondaire
vertFeuille:#4CAF78  ← succès, accents
orProfond:  #C8972A  ← badges premium, M2 Semences
orClair:    #F0C040  ← étoiles, highlights
cremeIvoire:#F6F3ED  ← fond principal
```

---

## Sprints

| Sprint | Contenu | Statut |
|---|---|---|
| Sprint 0 | Scaffold backend + mobile, DB, déploiement Railway | ✅ Complet |
| Sprint 1 | Auth complète : SendOTP, VerifyOTP, Login, Refresh, Logout | 🔜 Prochain |
| Sprint 2 | M1 Foncier — Annonces (CRUD, badges, photos) | — |
| Sprint 3 | M1 Foncier — Contrats, horodatage, litiges | — |
| Sprint 4 | M2 Semences — Catalogue fournisseurs, produits | — |
| Sprint 5 | M2 Semences — Commandes, CinetPay, USSD | — |
| Sprint 6 | M3 Conseil — Agronomes, matching | — |
| Sprint 7 | M3 Conseil — Sessions, planning, rappels Celery | — |
| Sprint 8 | Back-office Admin (Django Admin ou FastAPI Admin) | — |
| Sprint 9 | QA, tests de charge, audit OWASP | — |
| Sprint 10 | Bêta privée + corrections | — |

---

## Commandes fréquentes

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic revision --autogenerate -m "description"
alembic upgrade head
uvicorn app.main:app --reload
pytest

# Mobile
cd mobile
npm install
npx expo start
npx expo start --android
```

---

## Variables d'env critiques

- `DATABASE_URL` : `postgresql+asyncpg://user:pass@host:5432/db`
- `JWT_SECRET_KEY` : générer avec `openssl rand -hex 64`
- `OTP_DEV_BYPASS=true` + `OTP_DEV_CODE=123456` en développement
- `AT_USERNAME=sandbox` pour Africa's Talking sandbox

---

## Contraintes importantes

1. **Numéros CI** : format E.164 `+2250700000000` — validation stricte
2. **Monnaie** : FCFA (XOF) — stocker en `Float` en base, afficher formaté
3. **Multilingue** : Français prioritaire + prévoir Dioula/Baoulé en Phase 2
4. **Offline-first** : fiches techniques et plannings culturaux disponibles hors-ligne
5. **Android first** : 95%+ des utilisateurs CI sur Android
6. **3G** : optimiser les payloads, images compressées, pagination systématique