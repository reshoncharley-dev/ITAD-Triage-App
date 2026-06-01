'use client';

import type { DeviceRecord, RoutingDestination } from '@/types';

const BADGE: Record<RoutingDestination, string> = {
  Wholesale: 'bg-red-100 text-red-700',
  'RMS Quarantine': 'bg-orange-100 text-orange-700',
  'Battery Replacement': 'bg-yellow-100 text-yellow-700',
  'Internal Resale': 'bg-green-100 text-green-700',
};

interface Props {
  records: DeviceRecord[];
}

export default function SessionLog({ records }: Props) {
  if (records.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Session Log — {records.length} device{records.length !== 1 ? 's' : ''}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">UUID</th>
              <th className="px-4 py-3 text-left">Serial</th>
              <th className="px-4 py-3 text-left">Routing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[...records].reverse().map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-[12rem] truncate">
                  {r.uuid}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.serial}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[r.routing]}`}>
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
