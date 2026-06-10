# AGRILYO — Contexte développement (CLAUDE.md)

> Fichier de référence pour les sessions Claude Code.
> Mis à jour : juin 2026 | Stack : React Native + FastAPI + PostgreSQL

---

## Projet

**AGRILYO** (anciennement AGRO-CI) est la **plateforme agricole intégrée** de Côte d’Ivoire.

Elle permet aux agriculteurs, bailleurs de terres, semenciers et agronomes de se connecter dans un seul écosystème numérique de confiance.

**Vision** : Devenir l’infrastructure de référence qui résout trois problèmes majeurs de l’agriculture ivoirienne :
- Accès sécurisé à la terre (Foncier)
- Accès à des semences/plants de qualité
- Accompagnement agronomique professionnel

**Phase 1 (MVP)** : 3 piliers principaux  
**M1 Foncier · M2 Semences · M3 Conseil**

**Stratégie actuelle** : Développement **mobile-first** (React Native + Expo) avant la version web.  
Développement solo. Déploiement backend sur Railway.

---

## Features Clés (MVP Phase 1)

### 🌍 **M1 – Module Foncier**
- Dépôt et recherche d’annonces de terres (location, vente, métayage, abougnon)
- Système de **badges de sécurité** (Non vérifié / Droits coutumiers / Certificat Foncier / Titre Foncier)
- Upload photos + localisation GPS
- Modèles de contrats conformes (PDF exportables)
- Dépôt + horodatage numérique des contrats
- Messagerie sécurisée bailleur ↔ locataire
- Cartographie basique des annonces

### 🌍 **M2 – Module Semences & Plants**
- Catalogue national de semences et plants (variétés, certifications, stocks)
- Profils fournisseurs vérifiés + **Label Ivoire Semences**
- Commandes en ligne + panier multi-fournisseurs
- Paiement MVP via Stripe (Checkout Session / Payment Intent / webhooks)
- Canal **USSD** pour les zones sans internet
- Système d’avis et notation

### 🌍 **M3 – Module Conseil Agronomique**
- Profils d’agronomes certifiés
- Matching intelligent selon culture, zone et besoin
- Téléconseils audio/vidéo
- Planning cultural personnalisé + rappels (notifications/SMS)
- Bibliothèque de fiches techniques (offline)
- Messagerie avec envoi de photos pour diagnostic

**Fonctionnalités transversales** :
- Authentification OTP SMS
- Mode offline-first (fiches, plannings)
- Notifications push + SMS
- Paiements sécurisés
- Back-office admin

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
| Paiement | Stripe en phase test/MVP (Checkout Session, Payment Intent, webhooks signés) |
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

## Sprints (Mise à jour Juin 2026)

| Sprint | Contenu | Statut |
|---|---|---|
| Sprint 0 | Scaffold backend + mobile, DB, déploiement Railway | ✅ Complet |
| Sprint 1 | Auth complète : SendOTP, VerifyOTP, Login, Refresh, Logout | ✅ Terminé |
| Sprint 2 | M1 Foncier — Annonces (CRUD, badges, photos) | ✅ Terminé |
| Sprint 3 | M1 Foncier — Contrats OTP+SHA256, messagerie, litiges, `mes-annonces`, `contrat/creer` | ✅ Terminé |
| **Sprint 4** | **M2 Semences — Catalogue fournisseurs, produits, Label Ivoire Semences** | **✅ Terminé — S4-1 à S4-8 implémentés** |
| **Sprint 5** | **M2 Semences — Commandes, panier persistant, paiement Stripe, webhooks, notifications** | **En cours — S5-2 schémas + migration Alembic implémentés, S5-3 à venir** |
| Sprint 6 | M3 Conseil — Agronomes, matching | À préparer |
| Sprint 7 | M3 Conseil — Sessions, planning, rappels | — |
| Sprint 8 | Back-office Admin | — |
| Sprint 9 | QA, tests, audit | — |
| Sprint 10 | Bêta privée | — |
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
- `STRIPE_SECRET_KEY` : clé secrète Stripe test/MVP côté backend
- `STRIPE_PUBLISHABLE_KEY` : clé publique Stripe côté mobile/web
- `STRIPE_WEBHOOK_SECRET` : secret de signature des webhooks Stripe

---

## Contraintes importantes

1. **Numéros CI** : format E.164 `+2250700000000` — validation stricte
2. **Monnaie** : FCFA (XOF) — stocker en `Float` en base, afficher formaté
3. **Multilingue** : Français prioritaire + prévoir Dioula/Baoulé en Phase 2
4. **Offline-first** : fiches techniques et plannings culturaux disponibles hors-ligne
5. **Android first** : 95%+ des utilisateurs CI sur Android
6. **3G** : optimiser les payloads, images compressées, pagination systématique
