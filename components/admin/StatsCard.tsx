export function StatsCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
      <p className="font-data text-xs font-medium uppercase tracking-wide text-ink-300">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-navy-900">{value}</p>
    </div>
  );
}
