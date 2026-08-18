"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { PaginatedResponse, UserAdminResume } from "@/lib/types";

const ROLES = ["AGRICULTEUR", "BAILLEUR", "SEMENCIER", "AGRONOME", "ADMIN"] as const;
const STATUTS = ["PENDING", "ACTIVE", "SUSPENDED", "BANNED"] as const;

const STATUT_BADGE: Record<string, string> = {
  PENDING: "bg-alerte/10 text-alerte",
  ACTIVE: "bg-succes/10 text-succes",
  SUSPENDED: "bg-erreur/10 text-erreur",
  BANNED: "bg-gray-200 text-gray-600",
};

const STATUT_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  BANNED: "Banni",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserAdminResume[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Petit debounce pour ne pas spammer l'API à chaque frappe dans la recherche
    const timeout = setTimeout(() => {
      api
        .get<PaginatedResponse<UserAdminResume>>("/admin/users", {
          search: search || undefined,
          role: role || undefined,
          status: status || undefined,
          page,
          size: 20,
        })
        .then((res) => {
          setUsers(res.items);
          setTotal(res.total);
          setPages(res.pages);
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, role, status, page]);

  // Toute modification de filtre repart de la page 1
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
  };
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleToggleStatus = async (u: UserAdminResume) => {
    const nouveauStatut = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const label =
      nouveauStatut === "SUSPENDED" ? `Suspendre ${u.phone_number} ?` : `Réactiver ${u.phone_number} ?`;
    if (!window.confirm(label)) return;

    setActionPendingId(u.id);
    try {
      const updated = await api.patch<UserAdminResume>(`/admin/users/${u.id}/status`, {
        status: nouveauStatut,
      });
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
        <p className="text-sm text-gray-500">{total} compte{total > 1 ? "s" : ""} au total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher un numéro..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {STATUT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-erreur">{error}</p>}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Rôles</th>
              <th className="px-4 py-3 font-medium">Région</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
              <th className="px-4 py-3 font-medium">Dernière connexion</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Aucun utilisateur ne correspond à ces filtres.
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="hover:bg-cremeIvoire/50">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {u.first_name || u.last_name
                      ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                      : u.display_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.phone_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className="rounded-full bg-vertForet/10 px-2 py-0.5 text-xs text-vertForet"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.region ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_BADGE[u.status] ?? ""}`}
                    >
                      {STATUT_LABELS[u.status] ?? u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.last_login_at)}</td>
                  <td className="px-4 py-3">
                    {(u.status === "ACTIVE" || u.status === "SUSPENDED") && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={actionPendingId === u.id}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                          u.status === "SUSPENDED"
                            ? "border-succes text-succes hover:bg-succes/5"
                            : "border-erreur text-erreur hover:bg-erreur/5"
                        }`}
                      >
                        {u.status === "SUSPENDED" ? "Réactiver" : "Suspendre"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500">
            Page {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}