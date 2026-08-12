"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, logoutAdmin } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/agronomes", label: "Agronomes" },
  { href: "/fournisseurs", label: "Fournisseurs" },
  { href: "/foncier", label: "Annonces Foncier" },
  { href: "/litiges", label: "Litiges" },
  { href: "/users", label: "Utilisateurs" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  const handleLogout = () => {
    logoutAdmin();
    router.replace("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h1 className="text-lg font-bold tracking-wide text-vertForet">AGRILYO</h1>
        <p className="text-xs text-gray-400">Back-office admin</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-vertForet text-white"
                  : "text-gray-600 hover:bg-cremeIvoire hover:text-vertForet"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-4 py-4">
        {user && (
          <p className="mb-2 truncate text-xs text-gray-500">{user.phone_number}</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}