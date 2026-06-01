'use client';

import type { DeviceRecord, RoutingDestination } from '@/types';

const ROUTING_STYLES: Record<RoutingDestination, { bg: string; text: string; label: string }> = {
  Wholesale: {
    bg: 'bg-red-100 border-red-400',
    text: 'text-red-700',
    label: 'WHOLESALE',
  },
  'RMS Quarantine': {
    bg: 'bg-orange-100 border-orange-400',
    text: 'text-orange-700',
    label: 'RMS QUARANTINE',
  },
  'Battery Replacement': {
    bg: 'bg-yellow-100 border-yellow-400',
    text: 'text-yellow-700',
    label: 'BATTERY REPLACEMENT',
  },
  'Internal Resale': {
    bg: 'bg-green-100 border-green-400',
    text: 'text-green-700',
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
  const style = ROUTING_STYLES[record.routing];

  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-2xl border-2 p-6 ${style.bg}`}>
        <p className={`text-4xl font-black tracking-tight ${style.text}`}>{style.label}</p>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="font-semibold">UUID</span>
          <span className="font-mono break-all">{record.uuid}</span>
          <span className="font-semibold">Serial</span>
          <span className="font-mono break-all">{record.serial}</span>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        {syncing && <span>Syncing to Google Sheets…</span>}
        {syncError && <span className="text-red-500">Sheets sync failed: {syncError}</span>}
        {!syncing && !syncError && <span className="text-green-600">Synced to Google Sheets</span>}
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-blue-600 py-5 text-xl font-bold text-white transition hover:bg-blue-700"
      >
        Next Device
      </button>
    </div>
  );
}
