"""
Script de seed — données de test AGRILYO.

Crée un jeu de données réaliste couvrant les 4 modules (auth/rôles, Foncier,
Semences, Conseil) avec des statuts variés (EN_ATTENTE / VERIFIE / SUSPENDU...)
pour pouvoir tester chaque écran mobile et chaque page admin sans tout créer
à la main via Swagger.

Idempotent : relancer le script ne duplique rien (vérifie l'existence par
numéro de téléphone avant de créer).

Usage (depuis agrilyo/backend, avec le venv activé) :
    python scripts/seed_data.py

Tous les comptes créés partagent le même mot de passe (voir SEED_PASSWORD
ci-dessous) — utilisable directement sur /auth/login-password (mobile ET
admin-web), pas besoin de repasser par l'OTP pour se connecter.
"""

import asyncio
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_value
from app.models.conseil import (
    Agronome,
    DemandeConseil,
    StatutAgronome,
    StatutDemandeConseil,
    TypeConseil,
)
from app.models.foncier import AnnonceFonciere, BadgeSecurite, StatutAnnonce, StatutJuridique, TypeAcces
from app.models.semences import (
    FournisseurSemences,
    NiveauLabel,
    ProduitSemences,
    StatutFournisseur,
    StatutProduit,
    TypeProduit,
    UniteStock,
)
from app.models.user import User, UserRole, UserStatus

SEED_PASSWORD = "Agrilyo2026!"


async def get_or_create_user(session, phone: str, roles: list[UserRole], **extra) -> tuple[User, bool]:
    """Retourne (user, created). Ne recrée jamais un compte existant (idempotence)."""
    result = await session.execute(select(User).where(User.phone_number == phone))
    existing = result.scalar_one_or_none()
    if existing:
        return existing, False

    user = User(
        phone_number=phone,
        roles=[r.value for r in roles],
        status=UserStatus.ACTIVE,
        phone_verified=True,
        is_active=True,
        password_hash=hash_value(SEED_PASSWORD),
        **extra,
    )
    session.add(user)
    await session.flush()
    return user, True


async def seed() -> None:
    created_summary: list[str] = []

    async with AsyncSessionLocal() as session:
        # ═══════════════════════════════════════════════════════════════════
        # Utilisateurs de base
        # ═══════════════════════════════════════════════════════════════════
        admin, is_new = await get_or_create_user(
            session, "+2250700000001", [UserRole.ADMIN],
            first_name="Admin", last_name="AGRILYO", region="Abidjan",
        )
        if is_new:
            created_summary.append(f"ADMIN            {admin.phone_number}")

        agriculteurs = []
        for i, (prenom, nom, region) in enumerate(
            [
                ("Awa", "Koné", "Abidjan"),
                ("Ibrahim", "Traoré", "Bouaké"),
                ("Fatou", "Diabaté", "Korhogo"),
            ],
            start=10,
        ):
            user, is_new = await get_or_create_user(
                session, f"+22507000000{i}", [UserRole.AGRICULTEUR],
                first_name=prenom, last_name=nom, region=region,
            )
            agriculteurs.append(user)
            if is_new:
                created_summary.append(f"AGRICULTEUR      {user.phone_number}  ({prenom} {nom}, {region})")

        bailleur, is_new = await get_or_create_user(
            session, "+2250700000020", [UserRole.BAILLEUR],
            first_name="Kouadio", last_name="Yao", region="Bouaké",
        )
        if is_new:
            created_summary.append(f"BAILLEUR         {bailleur.phone_number}  (Kouadio Yao, Bouaké)")

        # ═══════════════════════════════════════════════════════════════════
        # Agronomes (file de validation + profils déjà vérifiés)
        # ═══════════════════════════════════════════════════════════════════
        agronome_attente_user, is_new = await get_or_create_user(
            session, "+2250700000030", [UserRole.AGRONOME],
            first_name="Séraphin", last_name="Bamba", region="Soubré",
        )
        if is_new:
            created_summary.append(f"AGRONOME(user)   {agronome_attente_user.phone_number}  EN_ATTENTE")
            session.add(Agronome(
                user_id=agronome_attente_user.id,
                titre="Ingénieur agronome — cacao & café",
                cultures=["Cacao", "Café"],
                regions_couvertes=["Soubré", "San-Pédro"],
                specialites=["diagnostic", "phytosanitaire"],
                annees_experience=4,
                statut=StatutAgronome.EN_ATTENTE,
            ))

        agronome_verifie_user, is_new = await get_or_create_user(
            session, "+2250700000031", [UserRole.AGRONOME],
            first_name="Marceline", last_name="Kouassi", region="Soubré",
        )
        agronome_verifie = None
        if is_new:
            created_summary.append(f"AGRONOME(user)   {agronome_verifie_user.phone_number}  VERIFIE")
            agronome_verifie = Agronome(
                user_id=agronome_verifie_user.id,
                titre="Spécialiste cacao — 12 ans d'expérience",
                organisation="ANADER Soubré",
                bio="Accompagnement des planteurs de cacao depuis 2013, spécialisée en lutte phytosanitaire.",
                cultures=["Cacao"],
                regions_couvertes=["Soubré", "San-Pédro", "Divo"],
                specialites=["diagnostic", "phytosanitaire", "planning_cultural"],
                langues=["fr", "dioula"],
                annees_experience=12,
                note_moyenne=4.7,
                nombre_sessions=38,
                statut=StatutAgronome.VERIFIE,
                verifie_le=datetime.now(timezone.utc) - timedelta(days=90),
            )
            session.add(agronome_verifie)

        # ═══════════════════════════════════════════════════════════════════
        # Fournisseurs Semences (validation + Label Ivoire)
        # ═══════════════════════════════════════════════════════════════════
        fournisseur_attente_user, is_new = await get_or_create_user(
            session, "+2250700000040", [UserRole.SEMENCIER],
            first_name="Moussa", last_name="Ouattara", region="Korhogo",
        )
        if is_new:
            created_summary.append(f"SEMENCIER(user)  {fournisseur_attente_user.phone_number}  EN_ATTENTE")
            session.add(FournisseurSemences(
                user_id=fournisseur_attente_user.id,
                nom_commercial="Semences du Nord",
                region="Korhogo",
                statut=StatutFournisseur.EN_ATTENTE,
            ))

        fournisseur_or_user, is_new = await get_or_create_user(
            session, "+2250700000041", [UserRole.SEMENCIER],
            first_name="Adjoua", last_name="N'Guessan", region="Yamoussoukro",
        )
        fournisseur_or = None
        if is_new:
            created_summary.append(f"SEMENCIER(user)  {fournisseur_or_user.phone_number}  VERIFIE + Label OR")
            fournisseur_or = FournisseurSemences(
                user_id=fournisseur_or_user.id,
                nom_commercial="Coopérative Semences Ivoire Plus",
                description="Semences certifiées riz, maïs et arachide — plus de 8 ans d'activité.",
                region="Yamoussoukro",
                ville="Yamoussoukro",
                telephone_pro=fournisseur_or_user.phone_number,
                statut=StatutFournisseur.VERIFIE,
                verifie_le=datetime.now(timezone.utc) - timedelta(days=200),
                label_ivoire=NiveauLabel.OR,
                label_attribue_le=datetime.now(timezone.utc) - timedelta(days=60),
                note_moyenne=4.8,
                nombre_avis=52,
                nombre_produits_actifs=2,
            )
            session.add(fournisseur_or)
            await session.flush()
            session.add_all([
                ProduitSemences(
                    fournisseur_id=fournisseur_or.id,
                    nom="Riz WARDA certifié",
                    type_produit=TypeProduit.SEMENCE,
                    variete="WARDA",
                    culture="Riz",
                    description="Semence de riz certifiée, haut rendement, adaptée bas-fonds.",
                    rendement_potentiel="5–7 t/ha",
                    saison_semis="Grande saison (avr–juil)",
                    prix_unitaire=850,
                    unite_stock=UniteStock.KG,
                    stock_disponible=1200,
                    stock_minimum_commande=25,
                    statut=StatutProduit.ACTIF,
                    note_moyenne=4.6,
                    nombre_avis=19,
                ),
                ProduitSemences(
                    fournisseur_id=fournisseur_or.id,
                    nom="Maïs hybride CMS-8704",
                    type_produit=TypeProduit.SEMENCE,
                    variete="CMS-8704",
                    culture="Maïs",
                    prix_unitaire=1200,
                    unite_stock=UniteStock.KG,
                    stock_disponible=600,
                    stock_minimum_commande=10,
                    statut=StatutProduit.ACTIF,
                    note_moyenne=4.9,
                    nombre_avis=11,
                ),
            ])

        # ═══════════════════════════════════════════════════════════════════
        # Foncier — annonces avec badges variés
        # ═══════════════════════════════════════════════════════════════════
        existing_annonces = (
            await session.execute(
                select(AnnonceFonciere).where(AnnonceFonciere.bailleur_id == bailleur.id)
            )
        ).scalars().all()
        if not existing_annonces:
            session.add_all([
                AnnonceFonciere(
                    bailleur_id=bailleur.id,
                    type_acces=TypeAcces.LOCATION,
                    superficie_ha=5.5,
                    prix_indicatif=750000,
                    region="Bouaké",
                    sous_prefecture="Bouaké",
                    statut_juridique=StatutJuridique.COUTUMIER,
                    badge=BadgeSecurite.NON_VERIFIE,
                    description="Terrain agricole en bordure de route, accès facile, point d'eau à proximité.",
                    statut=StatutAnnonce.ACTIVE,
                ),
                AnnonceFonciere(
                    bailleur_id=bailleur.id,
                    type_acces=TypeAcces.VENTE,
                    superficie_ha=12.0,
                    prix_indicatif=8500000,
                    region="Bouaké",
                    sous_prefecture="Sakassou",
                    statut_juridique=StatutJuridique.TF,
                    badge=BadgeSecurite.TF_VERIFIE,
                    description="Titre foncier vérifié, terrain plat, ancienne plantation de cacao.",
                    statut=StatutAnnonce.ACTIVE,
                ),
                AnnonceFonciere(
                    bailleur_id=bailleur.id,
                    type_acces=TypeAcces.METAYAGE,
                    superficie_ha=3.0,
                    region="Bouaké",
                    statut_juridique=StatutJuridique.COUTUMIER,
                    badge=BadgeSecurite.COUTUMIER_DECLARE,
                    description="Petite parcelle, idéale maraîchage, en attente de vérification du badge.",
                    statut=StatutAnnonce.EN_ATTENTE,
                ),
            ])
            created_summary.append("FONCIER          3 annonces créées (badges NON_VERIFIE / TF_VERIFIE / COUTUMIER_DECLARE)")

        # ═══════════════════════════════════════════════════════════════════
        # Conseil — demandes à différents stades du cycle de vie
        # ═══════════════════════════════════════════════════════════════════
        await session.flush()  # s'assurer que agronome_verifie.id est dispo si nouvellement créé
        if agronome_verifie is None:
            result = await session.execute(
                select(Agronome).where(Agronome.user_id == agronome_verifie_user.id)
            )
            agronome_verifie = result.scalar_one_or_none()

        existing_demandes = (
            await session.execute(
                select(DemandeConseil).where(DemandeConseil.agriculteur_id == agriculteurs[0].id)
            )
        ).scalars().all()
        if not existing_demandes:
            session.add_all([
                DemandeConseil(
                    agriculteur_id=agriculteurs[0].id,
                    type_conseil=TypeConseil.DIAGNOSTIC,
                    culture="Cacao",
                    region="Soubré",
                    titre="Taches brunes sur les feuilles de cacaoyer",
                    description="Apparition de taches brunes depuis une semaine sur plusieurs pieds, extension rapide.",
                    urgence=True,
                    statut=StatutDemandeConseil.NOUVELLE,
                ),
                DemandeConseil(
                    agriculteur_id=agriculteurs[1].id,
                    agronome_id=agronome_verifie.id if agronome_verifie else None,
                    type_conseil=TypeConseil.PLANNING_CULTURAL,
                    culture="Cacao",
                    region="Soubré",
                    titre="Planning de la campagne 2026",
                    description="Besoin d'aide pour planifier semis, traitements et récolte pour la prochaine campagne.",
                    statut=StatutDemandeConseil.ASSIGNEE if agronome_verifie else StatutDemandeConseil.NOUVELLE,
                    assigned_at=datetime.now(timezone.utc) - timedelta(days=5) if agronome_verifie else None,
                ),
                DemandeConseil(
                    agriculteur_id=agriculteurs[2].id,
                    agronome_id=agronome_verifie.id if agronome_verifie else None,
                    type_conseil=TypeConseil.SUIVI_CULTURE,
                    culture="Cacao",
                    region="Soubré",
                    titre="Suivi post-traitement phytosanitaire",
                    description="Vérification de l'efficacité du traitement appliqué le mois dernier.",
                    statut=StatutDemandeConseil.TERMINEE if agronome_verifie else StatutDemandeConseil.NOUVELLE,
                    assigned_at=datetime.now(timezone.utc) - timedelta(days=20) if agronome_verifie else None,
                    closed_at=datetime.now(timezone.utc) - timedelta(days=2) if agronome_verifie else None,
                ),
            ])
            created_summary.append("CONSEIL          3 demandes créées (NOUVELLE / ASSIGNEE / TERMINEE)")

        await session.commit()

    return created_summary


def main():
    summary = asyncio.run(seed())
    print("\n" + "=" * 70)
    if summary:
        print("✅ Données de seed créées :\n")
        for line in summary:
            print(f"  {line}")
    else:
        print("ℹ️  Rien à créer — toutes les données de seed existent déjà (idempotent).")
    print("\n" + "-" * 70)
    print(f"Mot de passe commun à tous les comptes créés : {SEED_PASSWORD}")
    print("Connexion : POST /auth/login-password (mobile ET admin-web)")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()