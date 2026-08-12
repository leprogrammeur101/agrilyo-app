"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, NotAdminError, ApiError } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(phone.trim(), password);
      router.replace("/");
    } catch (err) {
      if (err instanceof NotAdminError) {
        setError(err.message);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Connexion impossible. Vérifiez votre réseau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wide text-vertForet">AGRILYO</h1>
          <p className="mt-1 text-sm text-gray-500">Back-office administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              required
              placeholder="+2250700000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-vertForet focus:outline-none focus:ring-1 focus:ring-vertForet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-vertForet focus:outline-none focus:ring-1 focus:ring-vertForet"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-erreur">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-vertForet py-2.5 text-sm font-semibold text-white transition hover:bg-vertSavane disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Réservé aux comptes avec le rôle administrateur.
        </p>
      </div>
    </div>
  );
}