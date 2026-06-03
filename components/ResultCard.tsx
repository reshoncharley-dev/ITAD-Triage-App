'use client';

import type { DeviceRecord, RoutingDestination } from '@/types';

const ROUTING_CONFIG: Record<
  RoutingDestination,
  { bg: string; border: string; text: string; accent: string; label: string }
> = {
  Wholesale: {
    bg: 'bg-[var(--danger-light)]',
    border: 'border-[var(--danger)]/20',
    text: 'text-[var(--danger)]',
    accent: 'from-[#f2555a] to-[#e04449]',
    label: 'WHOLESALE',
  },
  'RMS Quarantine': {
    bg: 'bg-[var(--warning-light)]',
    border: 'border-[var(--warning)]/20',
    text: 'text-[var(--warning)]',
    accent: 'from-[#d97706] to-[#b45309]',
    label: 'RMS QUARANTINE',
  },
  'Battery Replacement': {
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    text: 'text-amber-600',
    accent: 'from-amber-400 to-amber-500',
    label: 'BATTERY REPLACEMENT',
  },
  'Internal Resale': {
    bg: 'bg-[var(--success-light)]',
    border: 'border-[var(--success)]/20',
    text: 'text-[var(--success)]',
    accent: 'from-[#16a34a] to-[#15803d]',
    label: 'INTERNAL RESALE',
  },
};

interface Props {
  record: DeviceRecord;
  syncing: boolean;
  syncError: string | null;
  onNext: () => void;
}

export default function ResultCard({ record, syncing, syncError, onNext }: Props) {
  const cfg = ROUTING_CONFIG[record.routing];

  return (
    <div className="flex flex-col gap-4 animate-scale-in">
      <div className={`rounded-2xl border overflow-hidden shadow-md ${cfg.bg} ${cfg.border}`}>
        <div className={`h-1 bg-gradient-to-r ${cfg.accent}`} />
        <div className="p-5">
          <p className={`text-3xl font-black tracking-tight ${cfg.text}`}>{cfg.label}</p>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <span className="font-semibold text-[var(--muted)]">UUID</span>
            <span className="font-mono tracking-wider text-[var(--foreground)] break-all">{record.uuid}</span>
            <span className="font-semibold text-[var(--muted)]">Serial</span>
            <span className="font-mono tracking-wider text-[var(--foreground)]">{record.serial}</span>
            {record.wholesaleReason && (
              <>
                <span className="font-semibold text-[var(--muted)]">Reason</span>
                <span className="text-[var(--foreground)]">{record.wholesaleReason}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs px-1">
        {syncing && (
          <span className="text-[var(--muted)]">Syncing to Google Sheets…</span>
        )}
        {syncError && (
          <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--danger-light)] border border-[var(--danger)]/15 text-[var(--danger)]">
            Sheets sync failed: {syncError}
          </span>
        )}
        {!syncing && !syncError && (
          <span className="text-[var(--success)]">Synced to Google Sheets</span>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#f2555a] to-[#e04449] hover:from-[#e04449] hover:to-[#cc3c42] transition-all shadow-sm"
      >
        Next Device
      </button>
    </div>
  );
}
