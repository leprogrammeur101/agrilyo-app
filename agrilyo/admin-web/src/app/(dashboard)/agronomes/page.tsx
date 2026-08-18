"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AgronomeResume, PaginatedResponse } from "@/lib/types";

const STATUTS = ["EN_ATTENTE", "VERIFIE", "SUSPENDU", "REJETE"] as const;
type Statut = (typeof STATUTS)[number];

const STATUT_LABELS: Record<Statut, string> = {
  EN_ATTENTE: "En attente",
  VERIFIE: "Vérifiés",
  SUSPENDU: "Suspendus",
  REJETE: "Rejetés",
};

const STATUT_BADGE: Record<Statut, string> = {
  EN_ATTENTE: "bg-alerte/10 text-alerte",
  VERIFIE: "bg-succes/10 text-succes",
  SUSPENDU: "bg-erreur/10 text-erreur",
  REJETE: "bg-gray-200 text-gray-500",
};

export default function AgronomesPage() {
  const [statut, setStatut] = useState<Statut>("EN_ATTENTE");
  const [agronomes, setAgronomes] = useState<AgronomeResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const charger = (s: Statut) => {
    setLoading(true);
    setError(null);
    api
      .get<PaginatedResponse<AgronomeResume>>("/admin/agronomes", { statut: s, size: 50 })
      .then((res) => setAgronomes(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger(statut);
  }, [statut]);

  const handleAction = async (id: string, nouveauStatut: "VERIFIE" | "SUSPENDU" | "REJETE") => {
    const confirmLabel =
      nouveauStatut === "VERIFIE" && statut === "SUSPENDU"
        ? "Réactiver ce profil ?"
        : nouveauStatut === "VERIFIE"
          ? "Valider ce profil agronome ?"
          : nouveauStatut === "SUSPENDU"
            ? "Suspendre ce profil ?"
            : "Rejeter ce profil ?";
    if (!window.confirm(confirmLabel)) return;

    setActionPendingId(id);
    try {
      if (statut === "EN_ATTENTE" && (nouveauStatut === "VERIFIE" || nouveauStatut === "REJETE")) {
        // Décision sur un profil en attente → endpoint admin dédié (garde EN_ATTENTE incluse)
        await api.patch(`/admin/agronomes/${id}/validate`, {
          decision: nouveauStatut,
          motif: noteDrafts[id]?.trim() || null,
        });
      } else {
        // Suspendre un profil VERIFIE, ou le réactiver depuis SUSPENDU
        await api.patch(`/conseil/agronomes/${id}/statut`, {
          statut: nouveauStatut,
          note_admin: noteDrafts[id]?.trim() || null,
        });
      }
      // Le profil quitte la file courante une fois son statut changé
      setAgronomes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Agronomes</h1>
        <p className="text-sm text-gray-500">Validation des profils agronomes / conseillers</p>
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

      {!loading && !error && agronomes.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-400">
          Aucun profil {STATUT_LABELS[statut].toLowerCase()} pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {agronomes.map((agronome) => (
          <div key={agronome.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{agronome.titre}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_BADGE[statut]}`}
                  >
                    {STATUT_LABELS[statut]}
                  </span>
                </div>
                {agronome.organisation && (
                  <p className="text-sm text-gray-500">{agronome.organisation}</p>
                )}
                <p className="mt-2 text-sm text-gray-600">
                  {agronome.annees_experience} ans d'expérience · note{" "}
                  {agronome.note_moyenne.toFixed(1)}/5 · {agronome.nombre_sessions} sessions
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {agronome.cultures.map((c) => (
                    <span key={c} className="rounded-full bg-vertForet/10 px-2 py-0.5 text-xs text-vertForet">
                      {c}
                    </span>
                  ))}
                  {agronome.regions_couvertes.map((r) => (
                    <span key={r} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {statut === "EN_ATTENTE" && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <input
                  type="text"
                  placeholder="Note admin (optionnel)"
                  value={noteDrafts[agronome.id] ?? ""}
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({ ...prev, [agronome.id]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(agronome.id, "VERIFIE")}
                    disabled={actionPendingId === agronome.id}
                    className="rounded-lg bg-succes px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleAction(agronome.id, "REJETE")}
                    disabled={actionPendingId === agronome.id}
                    className="rounded-lg border border-erreur px-4 py-2 text-sm font-medium text-erreur transition hover:bg-erreur/5 disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            )}

            {statut === "VERIFIE" && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button
                  onClick={() => handleAction(agronome.id, "SUSPENDU")}
                  disabled={actionPendingId === agronome.id}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Suspendre
                </button>
              </div>
            )}

            {statut === "SUSPENDU" && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button
                  onClick={() => handleAction(agronome.id, "VERIFIE")}
                  disabled={actionPendingId === agronome.id}
                  className="rounded-lg bg-succes px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Réactiver
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}