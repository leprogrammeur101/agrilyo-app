"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { KPIResponse } from "@/lib/types";
import StatCard from "@/components/StatCard";

const ROLE_LABELS: Record<string, string> = {
  AGRICULTEUR: "Agriculteurs",
  BAILLEUR: "Bailleurs",
  SEMENCIER: "Fournisseurs",
  AGRONOME: "Agronomes",
  ADMIN: "Admins",
};

const STATUT_DEMANDE_LABELS: Record<string, string> = {
  NOUVELLE: "Nouvelles",
  ASSIGNEE: "Assignées",
  EN_COURS: "En cours",
  TERMINEE: "Terminées",
  ANNULEE: "Annulées",
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<KPIResponse>("/admin/kpis")
      .then(setKpis)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Chargement des KPIs...</p>;
  if (error) return <p className="text-sm text-erreur">{error}</p>;
  if (!kpis) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble de la plateforme AGRILYO</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Général
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Utilisateurs" value={kpis.total_users} />
          <StatCard
            label="Agronomes en attente"
            value={kpis.agronomes_en_attente}
            accent="text-alerte"
          />
          <StatCard
            label="Fournisseurs en attente"
            value={kpis.fournisseurs_en_attente}
            accent="text-alerte"
          />
          <StatCard label="Litiges ouverts" value={kpis.litiges_ouverts} accent="text-erreur" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Utilisateurs par rôle
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Object.entries(kpis.users_par_role).map(([role, count]) => (
            <StatCard key={role} label={ROLE_LABELS[role] ?? role} value={count} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Demandes de conseil
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Object.entries(kpis.demandes_conseil_par_statut).map(([statut, count]) => (
            <StatCard
              key={statut}
              label={STATUT_DEMANDE_LABELS[statut] ?? statut}
              value={count}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Foncier & Semences
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Annonces actives" value={kpis.annonces_actives} />
          <StatCard label="Agronomes vérifiés" value={kpis.agronomes_verifies} />
          <StatCard label="Fournisseurs vérifiés" value={kpis.fournisseurs_verifies} />
        </div>
      </section>
    </div>
  );
}