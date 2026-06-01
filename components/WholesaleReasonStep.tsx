'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (reason: string) => void;
}

export default function WholesaleReasonStep({ onSubmit }: Props) {
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim()) onSubmit(reason.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--danger-light)] border border-[var(--danger)]/15">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="text-sm font-semibold text-[var(--danger)]">Routing to Wholesale</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Reason for Wholesale
        </label>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe why this device is being sent to wholesale…"
          rows={4}
          className="w-full px-4 py-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl placeholder-[var(--muted-light)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!reason.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#f2555a] to-[#e04449] hover:from-[#e04449] hover:to-[#cc3c42] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Confirm Wholesale
      </button>
    </form>
  );
}
