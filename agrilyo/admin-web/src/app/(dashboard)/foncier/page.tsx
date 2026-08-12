"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { PaginatedResponse } from "@/lib/types";

const BADGES = ["NON_VERIFIE", "COUTUMIER_DECLARE", "CF_VERIFIE", "TF_VERIFIE"] as const;
type Badge = (typeof BADGES)[number];

const BADGE_LABELS: Record<Badge, string> = {
  NON_VERIFIE: "Non vérifiées",
  COUTUMIER_DECLARE: "Coutumier déclaré",
  CF_VERIFIE: "CF vérifié",
  TF_VERIFIE: "TF vérifié",
};

const BADGE_BADGE: Record<Badge, string> = {
  NON_VERIFIE: "bg-alerte/10 text-alerte",
  COUTUMIER_DECLARE: "bg-orange-100 text-orange-700",
  CF_VERIFIE: "bg-blue-100 text-blue-700",
  TF_VERIFIE: "bg-succes/10 text-succes",
};

const TYPE_ACCES_LABELS: Record<string, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
  METAYAGE: "Métayage",
};

interface AnnonceResume {
  id: string;
  type_acces: string;
  superficie_ha: number;
  prix_indicatif: number | null;
  region: string;
  sous_prefecture: string | null;
  badge: Badge;
  statut_juridique: string;
  statut: string;
  vues: number;
  created_at: string;
  photo_url: string | null;
}

export default function FoncierPage() {
  const [badge, setBadge] = useState<Badge>("NON_VERIFIE");
  const [annonces, setAnnonces] = useState<AnnonceResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [nextBadgeDrafts, setNextBadgeDrafts] = useState<Record<string, Badge>>({});
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const charger = (b: Badge) => {
    setLoading(true);
    setError(null);
    api
      .get<PaginatedResponse<AnnonceResume>>("/foncier/annonces", { badge: b, size: 50 })
      .then((res) => setAnnonces(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger(badge);
  }, [badge]);

  const handleUpdateBadge = async (id: string) => {
    const nouveauBadge = nextBadgeDrafts[id] ?? "TF_VERIFIE";
    if (!window.confirm(`Attribuer le badge "${BADGE_LABELS[nouveauBadge]}" à cette annonce ?`)) {
      return;
    }

    setActionPendingId(id);
    try {
      await api.patch(`/foncier/annonces/${id}/badge`, {
        badge: nouveauBadge,
        note: noteDrafts[id]?.trim() || null,
      });
      setAnnonces((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Annonces Foncier</h1>
        <p className="text-sm text-gray-500">Vérification du badge sécurité des annonces</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BADGES.map((b) => (
          <button
            key={b}
            onClick={() => setBadge(b)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              badge === b ? "bg-vertForet text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {BADGE_LABELS[b]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Chargement...</p>}
      {error && <p className="text-sm text-erreur">{error}</p>}

      {!loading && !error && annonces.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-400">
          Aucune annonce avec ce badge pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {annonces.map((annonce) => (
          <div key={annonce.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">
                    {TYPE_ACCES_LABELS[annonce.type_acces] ?? annonce.type_acces} ·{" "}
                    {annonce.superficie_ha} ha
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_BADGE[annonce.badge]}`}
                  >
                    {BADGE_LABELS[annonce.badge]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {annonce.region}
                  {annonce.sous_prefecture ? ` · ${annonce.sous_prefecture}` : ""}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Statut juridique : {annonce.statut_juridique} · {annonce.vues} vues
                  {annonce.prix_indicatif != null &&
                    ` · ${annonce.prix_indicatif.toLocaleString("fr-FR")} FCFA`}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase text-gray-400">
                  Nouveau badge
                </span>
                {BADGES.map((b) => (
                  <button
                    key={b}
                    onClick={() =>
                      setNextBadgeDrafts((prev) => ({ ...prev, [annonce.id]: b }))
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      (nextBadgeDrafts[annonce.id] ?? "TF_VERIFIE") === b
                        ? "border-vertForet bg-vertForet/10 text-vertForet"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {BADGE_LABELS[b]}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Note / motif (optionnel)"
                value={noteDrafts[annonce.id] ?? ""}
                onChange={(e) =>
                  setNoteDrafts((prev) => ({ ...prev, [annonce.id]: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
              />
              <button
                onClick={() => handleUpdateBadge(annonce.id)}
                disabled={actionPendingId === annonce.id}
                className="rounded-lg bg-vertForet px-4 py-2 text-sm font-medium text-white transition hover:bg-vertSavane disabled:opacity-50"
              >
                Mettre à jour le badge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}