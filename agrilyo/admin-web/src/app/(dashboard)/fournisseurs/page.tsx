"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { FournisseurResume, PaginatedResponse } from "@/lib/types";

const STATUTS = ["EN_ATTENTE", "VERIFIE", "SUSPENDU", "REJETE"] as const;
type Statut = (typeof STATUTS)[number];

const STATUT_LABELS: Record<Statut, string> = {
  EN_ATTENTE: "En attente",
  VERIFIE: "Vérifiés",
  SUSPENDU: "Suspendus",
  REJETE: "Rejetés",
};

const NIVEAUX_LABEL = ["BRONZE", "ARGENT", "OR"] as const;

const LABEL_BADGE: Record<string, string> = {
  BRONZE: "bg-orange-100 text-orange-700",
  ARGENT: "bg-gray-200 text-gray-600",
  OR: "bg-semences/20 text-yellow-700",
};

export default function FournisseursPage() {
  const [statut, setStatut] = useState<Statut>("EN_ATTENTE");
  const [fournisseurs, setFournisseurs] = useState<FournisseurResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const charger = (s: Statut) => {
    setLoading(true);
    setError(null);
    api
      .get<PaginatedResponse<FournisseurResume>>("/admin/fournisseurs", { statut: s, size: 50 })
      .then((res) => setFournisseurs(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger(statut);
  }, [statut]);

  const handleStatutAction = async (
    id: string,
    nouveauStatut: "VERIFIE" | "SUSPENDU" | "REJETE"
  ) => {
    const confirmLabel =
      nouveauStatut === "VERIFIE"
        ? "Valider ce fournisseur ?"
        : nouveauStatut === "SUSPENDU"
          ? "Suspendre ce fournisseur ?"
          : "Rejeter ce fournisseur ?";
    if (!window.confirm(confirmLabel)) return;

    setActionPendingId(id);
    try {
      await api.patch(`/semences/fournisseurs/${id}/statut`, {
        statut: nouveauStatut,
        note_admin: noteDrafts[id]?.trim() || null,
      });
      setFournisseurs((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setActionPendingId(null);
    }
  };

  const handleLabel = async (id: string, niveau: (typeof NIVEAUX_LABEL)[number] | null) => {
    const confirmLabel = niveau
      ? `Attribuer le label ${niveau} ?`
      : "Retirer le Label Ivoire de ce fournisseur ?";
    if (!window.confirm(confirmLabel)) return;

    setActionPendingId(id);
    try {
      const updated = await api.patch<FournisseurResume>(
        `/semences/fournisseurs/${id}/label-ivoire`,
        { label_ivoire: niveau, label_expire_le: null }
      );
      setFournisseurs((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Fournisseurs</h1>
        <p className="text-sm text-gray-500">Validation des fournisseurs & Label Ivoire Semences</p>
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

      {!loading && !error && fournisseurs.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-400">
          Aucun fournisseur {STATUT_LABELS[statut].toLowerCase()} pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {fournisseurs.map((f) => (
          <div key={f.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{f.nom_commercial}</h3>
                  {f.label_ivoire && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_BADGE[f.label_ivoire]}`}
                    >
                      Label {f.label_ivoire}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {f.region}
                  {f.ville ? ` · ${f.ville}` : ""}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Note {f.note_moyenne.toFixed(1)}/5 · {f.nombre_produits_actifs} produits actifs
                </p>
              </div>
            </div>

            {statut === "EN_ATTENTE" && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <input
                  type="text"
                  placeholder="Note admin (optionnel)"
                  value={noteDrafts[f.id] ?? ""}
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatutAction(f.id, "VERIFIE")}
                    disabled={actionPendingId === f.id}
                    className="rounded-lg bg-succes px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleStatutAction(f.id, "REJETE")}
                    disabled={actionPendingId === f.id}
                    className="rounded-lg border border-erreur px-4 py-2 text-sm font-medium text-erreur transition hover:bg-erreur/5 disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            )}

            {statut === "VERIFIE" && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-gray-400">
                    Label Ivoire Semences
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {NIVEAUX_LABEL.map((niveau) => (
                      <button
                        key={niveau}
                        onClick={() => handleLabel(f.id, niveau)}
                        disabled={actionPendingId === f.id || f.label_ivoire === niveau}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${
                          f.label_ivoire === niveau
                            ? "border-vertForet bg-vertForet/10 text-vertForet"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {niveau}
                      </button>
                    ))}
                    {f.label_ivoire && (
                      <button
                        onClick={() => handleLabel(f.id, null)}
                        disabled={actionPendingId === f.id}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                      >
                        Retirer le label
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleStatutAction(f.id, "SUSPENDU")}
                  disabled={actionPendingId === f.id}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Suspendre
                </button>
              </div>
            )}

            {statut === "SUSPENDU" && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button
                  onClick={() => handleStatutAction(f.id, "VERIFIE")}
                  disabled={actionPendingId === f.id}
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