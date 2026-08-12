interface StatCardProps {
  label: string;
  value: number | string;
  accent?: string; // couleur Tailwind, ex. "text-vertForet"
}

export default function StatCard({ label, value, accent = "text-vertForet" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}