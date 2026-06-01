'use client';

import type { DeviceRecord, RoutingDestination } from '@/types';

const BADGE: Record<RoutingDestination, string> = {
  Wholesale: 'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/15',
  'RMS Quarantine': 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/15',
  'Battery Replacement': 'bg-amber-50 text-amber-600 border border-amber-200/60',
  'Internal Resale': 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/15',
};

interface Props {
  records: DeviceRecord[];
}

export default function SessionLog({ records }: Props) {
  if (records.length === 0) return null;

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Session Log
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)] text-xs font-semibold">
          {records.length}
        </span>
      </div>
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-md bg-[var(--card)]">
        <div className="h-0.5 bg-gradient-to-r from-[#f2555a] via-[#f2555a]/50 to-transparent" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--background)] to-white">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">UUID</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Serial</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Routing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {[...records].reverse().map((r, i) => (
              <tr key={i} className="hover:bg-[var(--card-hover)] transition-colors">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)] max-w-[10rem] truncate">
                  {r.uuid}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]">
                  {r.serial}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[r.routing]}`}>
                    {r.routing}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
