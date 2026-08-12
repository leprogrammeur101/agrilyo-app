"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Litige, PaginatedResponse } from "@/lib/types";

const STATUTS = ["OUVERT", "MEDIATION", "RESOLU", "ESCALADE"] as const;
type Statut = (typeof STATUTS)[number];

const STATUT_LABELS: Record<Statut, string> = {
  OUVERT: "Ouverts",
  MEDIATION: "En médiation",
  RESOLU: "Résolus",
  ESCALADE: "Escaladés (AFOR)",
};

const STATUT_BADGE: Record<Statut, string> = {
  OUVERT: "bg-erreur/10 text-erreur",
  MEDIATION: "bg-alerte/10 text-alerte",
  RESOLU: "bg-succes/10 text-succes",
  ESCALADE: "bg-gray-200 text-gray-600",
};

// Transitions autorisées depuis chaque statut — évite de proposer une action invalide
const TRANSITIONS: Record<Statut, { vers: Statut; label: string; primary?: boolean }[]> = {
  OUVERT: [
    { vers: "MEDIATION", label: "Passer en médiation", primary: true },
    { vers: "ESCALADE", label: "Escalader vers l'AFOR" },
  ],
  MEDIATION: [
    { vers: "RESOLU", label: "Marquer comme résolu", primary: true },
    { vers: "ESCALADE", label: "Escalader vers l'AFOR" },
  ],
  RESOLU: [],
  ESCALADE: [{ vers: "RESOLU", label: "Marquer comme résolu", primary: true }],
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LitigesPage() {
  const [statut, setStatut] = useState<Statut>("OUVERT");
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const charger = (s: Statut) => {
    setLoading(true);
    setError(null);
    api
      .get<PaginatedResponse<Litige>>("/foncier/litiges", { statut: s, size: 50 })
      .then((res) => setLitiges(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger(statut);
  }, [statut]);

  const handleResoudre = async (id: string, nouveauStatut: Statut) => {
    const resolution = resolutionDrafts[id]?.trim();
    if (nouveauStatut === "RESOLU" && !resolution) {
      alert("Décrivez la résolution avant de clôturer ce litige.");
      return;
    }
    if (!window.confirm(`Confirmer : ${STATUT_LABELS[nouveauStatut]} ?`)) return;

    setActionPendingId(id);
    try {
      await api.patch(`/foncier/litiges/${id}/resoudre`, {
        statut: nouveauStatut,
        resolution: resolution || null,
      });
      setLitiges((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Litiges</h1>
        <p className="text-sm text-gray-500">Différends déclarés sur des contrats fonciers</p>
      </div>

      <div className="flex gap-2">
        {STATUTS.map((s) => (
          <button
            key={s}
            onClick={() => setStatut(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statut === s
                ? "bg-vertForet text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Chargement...</p>}
      {error && <p className="text-sm text-erreur">{error}</p>}

      {!loading && !error && litiges.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-400">
          Aucun litige {STATUT_LABELS[statut].toLowerCase()} pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {litiges.map((litige) => {
          const transitions = TRANSITIONS[statut];
          return (
            <div key={litige.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_BADGE[statut]}`}
                    >
                      {STATUT_LABELS[statut]}
                    </span>
                    <span className="text-xs text-gray-400">
                      Déclaré le {formatDate(litige.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{litige.description}</p>
                  {litige.resolution && (
                    <div className="mt-3 rounded-lg bg-cremeIvoire p-3">
                      <p className="text-xs font-medium uppercase text-gray-400">Résolution</p>
                      <p className="mt-1 text-sm text-gray-700">{litige.resolution}</p>
                    </div>
                  )}
                </div>
              </div>

              {transitions.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  <textarea
                    placeholder="Décrire la résolution (obligatoire pour clôturer)"
                    value={resolutionDrafts[litige.id] ?? ""}
                    onChange={(e) =>
                      setResolutionDrafts((prev) => ({ ...prev, [litige.id]: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {transitions.map((t) => (
                      <button
                        key={t.vers}
                        onClick={() => handleResoudre(litige.id, t.vers)}
                        disabled={actionPendingId === litige.id}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                          t.primary
                            ? "bg-vertForet text-white hover:bg-vertSavane"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}