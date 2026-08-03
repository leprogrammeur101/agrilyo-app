# AGRILYO — Carte complète de la structure de fichiers

## Arbre complet du projet

```
agrilyo/                                ← Racine du repo Git
│
├── CLAUDE.md                           ← Contexte persistant pour Claude Code
│
├── backend/                            ← Projet FastAPI (Python)
│   │
│   ├── requirements.txt                ← Dépendances Python (pip install -r)
│   ├── Procfile                        ← Commande de démarrage Railway
│   ├── railway.json                    ← Config déploiement Railway (health check, restart)
│   ├── alembic.ini                     ← Config Alembic (migrations DB)
│   ├── pytest.ini                      ← Config pytest (asyncio_mode=auto)
│   ├── .env.example                    ← Template variables d'environnement (à copier en .env)
│   ├── .env                            ← ⚠️  Variables réelles — NE PAS commiter dans git
│   │
│   ├── app/                            ← Package Python principal
│   │   ├── __init__.py
│   │   ├── main.py                     ← Point d'entrée FastAPI (app, CORS, lifespan, routers)
│   │   │
│   │   ├── core/                       ← Configuration et infrastructure transversale
│   │   │   ├── __init__.py
│   │   │   ├── config.py               ← Settings Pydantic (toutes les variables d'env typées)
│   │   │   ├── database.py             ← Moteur SQLAlchemy async, SessionLocal, Base, get_db()
│   │   │   └── security.py             ← JWT (create/verify), OTP (generate), hachage bcrypt
│   │   │
│   │   ├── models/                     ← Modèles SQLAlchemy ORM (tables PostgreSQL)
│   │   │   ├── __init__.py             ← ⚠️  Importer TOUS les modèles ici (nécessaire pour Alembic)
│   │   │   ├── user.py                 ← Modèle User (entité centrale polymorphe, rôles, statut)
│   │   │   ├── otp.py                  ← Modèle OTPCode (code haché, expiration, tentatives)
│   │   │   │
│   │   │   │   ── Sprint 2+ : créer ces fichiers ──
│   │   │   ├── foncier.py              ← AnnonceFonciere, DocumentFoncier, Contrat, Litige, Thread
│   │   │   ├── semences.py             ← Fournisseur, Produit, Commande, LigneCommande, Avis, Paiement
│   │   │   └── conseil.py              ← Agronome, DemandeConseil, SessionConseil, Planning, Operation
│   │   │
│   │   ├── schemas/                    ← Schémas Pydantic v2 (validation des données API)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                 ← SendOTPRequest, VerifyOTPRequest, AuthResponse, UserPublicSchema
│   │   │   │
│   │   │   │   ── Sprint 2+ : créer ces fichiers ──
│   │   │   ├── foncier.py              ← AnnonceCreate, AnnonceUpdate, AnnonceResponse, BadgeUpdate
│   │   │   ├── semences.py             ← ProduitCreate, CommandeCreate, AvisCreate
│   │   │   └── conseil.py              ← AgronomeCreate, DemandeConseilCreate, PlanningCreate
│   │   │
│   │   ├── api/                        ← Couche HTTP (routes FastAPI)
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py           ← Agrège tous les sous-routeurs (include_router)
│   │   │       └── endpoints/
│   │   │           ├── __init__.py
│   │   │           ├── health.py       ← GET /api/v1/health (monitoring Railway)
│   │   │           │
│   │   │           │   ── Sprint 1 : créer ──
│   │   │           ├── auth.py         ← POST /auth/send-otp, /auth/verify-otp, /auth/refresh, /auth/me
│   │   │           │
│   │   │           │   ── Sprint 2/3 : créer ──
│   │   │           ├── foncier.py      ← CRUD annonces, badges, contrats, litiges
│   │   │           │
│   │   │           │   ── Sprint 4/5 : créer ──
│   │   │           ├── semences.py     ← Catalogue, commandes, label, USSD webhook
│   │   │           │
│   │   │           │   ── Sprint 6/7 : créer ──
│   │   │           └── conseil.py      ← Agronomes, matching, sessions, planning
│   │   │
│   │   ├── services/                   ← Logique métier (jamais dans les routes)
│   │   │   ├── __init__.py
│   │   │   ├── sms_service.py          ← Envoi SMS via Africa's Talking (OTP + notifications)
│   │   │   │
│   │   │   │   ── Sprint 1+ : créer ces fichiers ──
│   │   │   ├── auth_service.py         ← Logique SendOTP, VerifyOTP, gestion sessions
│   │   │   ├── paiement_service.py     ← Paiement reporté (placeholder, non branché)
│   │   │   ├── storage_service.py      ← Cloudflare R2 : upload, URL signées, suppression
│   │   │   ├── notification_service.py ← FCM push + SMS Africa's Talking
│   │   │   └── matching_service.py     ← Algorithme matching agronomes/agriculteurs
│   │   │
│   │   └── utils/                      ← Fonctions utilitaires pures
│   │       └── __init__.py
│   │           ── Sprint 1+ : ajouter ──
│   │           ├── phone.py            ← Normalisation/validation numéros CI
│   │           ├── fcfa.py             ← Formatage montants FCFA
│   │           └── pagination.py       ← Helper pagination (skip/limit → page/size)
│   │
│   ├── alembic/                        ← Migrations de base de données
│   │   ├── env.py                      ← Config Alembic (importe Base + tous les modèles)
│   │   └── versions/                   ← Fichiers de migration générés automatiquement
│   │       └── .gitkeep                ← Garde le dossier dans git (vide au début)
│   │           ── Généré par : alembic revision --autogenerate -m "description" ──
│   │
│   └── tests/                          ← Tests automatisés pytest
│       ├── __init__.py
│       ├── unit/                       ← Tests unitaires (sans DB, sans réseau)
│       │   └── __init__.py
│       │       ── Sprint 1+ : créer ──
│       │       ├── test_security.py    ← Tests JWT, OTP, hachage
│       │       └── test_schemas.py     ← Tests validation Pydantic
│       └── integration/                ← Tests d'intégration (avec DB de test)
│           └── __init__.py
│               ── Sprint 1+ : créer ──
│               └── test_auth.py        ← Tests endpoints auth (send-otp, verify-otp)
│
└── mobile/                             ← Projet React Native / Expo
    │
    ├── package.json                    ← Dépendances npm (npm install)
    ├── app.json                        ← Config Expo (nom app, bundle ID, splash, permissions)
    ├── tsconfig.json                   ← À créer : Config TypeScript
    ├── babel.config.js                 ← À créer : Config Babel (Expo preset + Reanimated)
    ├── .env                            ← Variables d'env Expo (EXPO_PUBLIC_API_URL=...)
    │
    ├── app/                            ← Expo Router — chaque fichier = une route
    │   ├── _layout.tsx                 ← Root layout (fonts, QueryClient, auth redirect)
    │   │
    │   ├── (auth)/                     ← Groupe auth (pas de tabs, fond crème)
    │   │   ├── _layout.tsx             ← Layout groupe auth (Stack, animation)
    │   │   ├── login.tsx               ← Écran saisie numéro de téléphone
    │   │   ├── verify-otp.tsx          ← Écran saisie code OTP (6 cases)
    │   │   └── onboarding.tsx          ← À créer Sprint 1 : profil premier login
    │   │
    │   └── (tabs)/                     ← Groupe tabs (navigation principale)
    │       ├── _layout.tsx             ← Bottom tabs (Accueil, Foncier, Semences, Conseil)
    │       ├── index.tsx               ← Onglet Accueil (dashboard, cartes modules)
    │       ├── foncier.tsx             ← Onglet Foncier (placeholder → Sprint 2)
    │       ├── semences.tsx            ← Onglet Semences (placeholder → Sprint 4)
    │       └── conseil.tsx             ← Onglet Conseil (placeholder → Sprint 6)
    │
    ├── api/                            ← Couche appels HTTP
    │   ├── client.ts                   ← Instance Axios + intercepteurs JWT refresh automatique
    │   ├── auth.api.ts                 ← sendOTP(), verifyOTP(), getMe(), logout()
    │   │
    │   │   ── Sprint 2+ : créer ces fichiers ──
    │   ├── foncier.api.ts              ← CRUD annonces, upload photos, contrats
    │   ├── semences.api.ts             ← Catalogue, panier, commandes
    │   └── conseil.api.ts              ← Agronomes, matching, sessions, planning
    │
    ├── store/                          ← État global Zustand (un fichier par domaine)
    │   ├── auth.store.ts               ← user, isAuthenticated, setAuth(), logout(), initialize()
    │   │
    │   │   ── Sprint 2+ : créer ces fichiers ──
    │   ├── foncier.store.ts            ← Filtres annonces, annonce sélectionnée
    │   ├── semences.store.ts           ← Panier commande, filtres catalogue
    │   └── conseil.store.ts            ← Demande de conseil en cours, planning
    │
    ├── constants/                      ← Valeurs figées du design system
    │   ├── colors.ts                   ← Palette AGRILYO (vertForet, orProfond, cremeIvoire...)
    │   └── theme.ts                    ← Spacing, FontSize, FontFamily, BorderRadius, Shadow, CI_REGIONS
    │
    ├── components/                     ← Composants réutilisables
    │   ├── ui/                         ← Composants génériques (Button, Input, Badge, Card...)
    │   │   ── Sprint 1+ : créer ──
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx               ← Badge sécurité foncier (NON_VERIFIE, CF_VERIFIE...)
    │   │   └── LoadingScreen.tsx
    │   └── common/                     ← Composants métier partagés
    │       ── Sprint 2+ : créer ──
    │       ├── AnnonceCard.tsx         ← Carte annonce foncière
    │       ├── ProduitCard.tsx         ← Carte semence/plant
    │       └── AgronomeCard.tsx        ← Carte profil agronome
    │
    ├── hooks/                          ← Hooks React custom
    │   ── Sprint 1+ : créer ──
    │   ├── useAuth.ts                  ← Wrapper useAuthStore avec helpers
    │   └── useFormatFCFA.ts            ← Formatage montants FCFA
    │
    ├── utils/                          ← Fonctions utilitaires TypeScript
    │   ── Sprint 1+ : créer ──
    │   ├── phone.ts                    ← Normalisation numéros CI
    │   └── formatters.ts               ← FCFA, hectares, dates
    │
    └── assets/                         ← Ressources statiques
        ├── fonts/                      ← Fichiers .ttf (si chargement local)
        ├── icon.png                    ← Icône app (1024x1024)
        ├── splash.png                  ← Splash screen (1284x2778)
        ├── adaptive-icon.png           ← Icône Android adaptative
        ├── favicon.png                 ← Favicon web
        └── notification-icon.png       ← Icône notification Android
```

---

## Résumé : fichiers générés vs à créer

### ✅ Déjà générés (Sprint 0)

| Fichier | Emplacement |
|---|---|
| `CLAUDE.md` | `agrilyo/` |
| `requirements.txt` | `backend/` |
| `Procfile` | `backend/` |
| `railway.json` | `backend/` |
| `alembic.ini` | `backend/` |
| `pytest.ini` | `backend/` |
| `.env.example` | `backend/` |
| `main.py` | `backend/app/` |
| `config.py` | `backend/app/core/` |
| `database.py` | `backend/app/core/` |
| `security.py` | `backend/app/core/` |
| `user.py` | `backend/app/models/` |
| `otp.py` | `backend/app/models/` |
| `__init__.py` (models) | `backend/app/models/` |
| `auth.py` (schemas) | `backend/app/schemas/` |
| `health.py` | `backend/app/api/v1/endpoints/` |
| `router.py` | `backend/app/api/v1/` |
| `sms_service.py` | `backend/app/services/` |
| `alembic/env.py` | `backend/alembic/` |
| `package.json` | `mobile/` |
| `app.json` | `mobile/` |
| `_layout.tsx` (root) | `mobile/app/` |
| `_layout.tsx` (auth) | `mobile/app/(auth)/` |
| `login.tsx` | `mobile/app/(auth)/` |
| `verify-otp.tsx` | `mobile/app/(auth)/` |
| `_layout.tsx` (tabs) | `mobile/app/(tabs)/` |
| `index.tsx` | `mobile/app/(tabs)/` |
| `foncier.tsx` | `mobile/app/(tabs)/` |
| `semences.tsx` | `mobile/app/(tabs)/` |
| `conseil.tsx` | `mobile/app/(tabs)/` |
| `client.ts` | `mobile/api/` |
| `auth.api.ts` | `mobile/api/` |
| `auth.store.ts` | `mobile/store/` |
| `colors.ts` | `mobile/constants/` |
| `theme.ts` | `mobile/constants/` |

### 🔜 À créer Sprint 1 (prochain)

| Fichier | Emplacement | Contenu |
|---|---|---|
| `auth_service.py` | `backend/app/services/` | Logique SendOTP, VerifyOTP, refresh |
| `auth.py` (endpoints) | `backend/app/api/v1/endpoints/` | Routes POST /auth/* |
| `tsconfig.json` | `mobile/` | Config TypeScript Expo |
| `babel.config.js` | `mobile/` | Config Babel (Reanimated plugin) |
| `.env` | `mobile/` | `EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1` |
| `onboarding.tsx` | `mobile/app/(auth)/` | Écran complétion profil (1er login) |

---

## Règle de nommage des prochains fichiers

```
backend/
  app/models/     → un fichier par module   : foncier.py, semences.py, conseil.py
  app/schemas/    → un fichier par module   : foncier.py, semences.py, conseil.py
  app/services/   → un fichier par service  : auth_service.py, paiement_service.py
  app/api/v1/endpoints/ → un fichier par module : auth.py, foncier.py, semences.py, conseil.py

mobile/
  app/(tabs)/     → un fichier par onglet   (déjà en place)
  api/            → un fichier par module   : foncier.api.ts, semences.api.ts
  store/          → un fichier par domaine  : foncier.store.ts, semences.store.ts
  components/ui/  → un fichier par composant : Button.tsx, Badge.tsx, Input.tsx
```
