'use client';

import { useState } from 'react';

export interface TriageAnswers {
  bricked: boolean | null;
  diag: boolean | null;
  backMarket: boolean | null;
  rms: boolean | null;
  battery: boolean | null;
}

const EMPTY: TriageAnswers = {
  bricked: null,
  diag: null,
  backMarket: null,
  rms: null,
  battery: null,
};

function resolveRouting(a: TriageAnswers): string | null {
  if (a.bricked === true) return 'Wholesale';
  if (a.bricked === false && a.diag === false) return 'Wholesale';
  if (a.bricked === false && a.diag === true && a.backMarket === false) return 'Wholesale';
  if (a.bricked === false && a.diag === true && a.backMarket === true && a.rms === false) return 'RMS Quarantine';
  if (a.bricked === false && a.diag === true && a.backMarket === true && a.rms === true && a.battery === false) return 'Battery Replacement';
  if (a.bricked === false && a.diag === true && a.backMarket === true && a.rms === true && a.battery === true) return 'Internal Resale';
  return null;
}

interface AnswerRowProps {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}

function AnswerRow({ label, value, onChange }: AnswerRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 animate-fade-in">
      <span className="text-sm font-medium text-[var(--foreground)] leading-snug">{label}</span>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            value === true
              ? 'bg-gradient-to-r from-[var(--success)] to-[#15803d] text-white shadow-sm'
              : 'bg-white border border-[var(--border)] text-[var(--muted)] hover:border-[var(--success)] hover:text-[var(--success)]'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            value === false
              ? 'bg-gradient-to-r from-[#f2555a] to-[#e04449] text-white shadow-sm'
              : 'bg-white border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

interface Props {
  uuid: string;
  serial: string;
  onSubmit: (answers: TriageAnswers, wholesaleReason?: string) => void;
}

export default function TriageForm({ uuid, serial, onSubmit }: Props) {
  const [answers, setAnswers] = useState<TriageAnswers>(EMPTY);
  const [wholesaleReason, setWholesaleReason] = useState('');

  function answer(field: keyof TriageAnswers) {
    return (v: boolean) =>
      setAnswers((prev) => {
        // Reset all fields that come after this one in the chain
        const next: TriageAnswers = { ...prev, [field]: v };
        if (field === 'bricked') {
          next.diag = null; next.backMarket = null; next.rms = null; next.battery = null;
        } else if (field === 'diag') {
          next.backMarket = null; next.rms = null; next.battery = null;
        } else if (field === 'backMarket') {
          next.rms = null; next.battery = null;
        } else if (field === 'rms') {
          next.battery = null;
        }
        return next;
      });
  }

  const routing = resolveRouting(answers);
  const needsReason = routing === 'Wholesale';
  const canSubmit = routing !== null && (!needsReason || wholesaleReason.trim().length > 0);

  // Progressive visibility
  const showDiag = answers.bricked === false;
  const showBackMarket = showDiag && answers.diag === true;
  const showRms = showBackMarket && answers.backMarket === true;
  const showBattery = showRms && answers.rms === true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(answers, needsReason ? wholesaleReason.trim() : undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Device summary bar */}
      <div className="flex gap-4 px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">UUID</span>
          <span className="text-xs font-mono truncate text-[var(--foreground)]">{uuid}</span>
        </div>
        <div className="w-px bg-[var(--border)]" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Serial</span>
          <span className="text-xs font-mono truncate text-[var(--foreground)]">{serial}</span>
        </div>
      </div>

      {/* Progressive questions */}
      <div className="rounded-xl border border-[var(--border)] bg-white px-4 flex flex-col divide-y divide-[var(--border)]">
        <div className="py-3">
          <AnswerRow label="Is the device bricked?" value={answers.bricked} onChange={answer('bricked')} />
        </div>
        {showDiag && (
          <div className="py-3">
            <AnswerRow label="Did it pass diagnostics?" value={answers.diag} onChange={answer('diag')} />
          </div>
        )}
        {showBackMarket && (
          <div className="py-3">
            <AnswerRow label="Is it Back Market resalable?" value={answers.backMarket} onChange={answer('backMarket')} />
          </div>
        )}
        {showRms && (
          <div className="py-3">
            <AnswerRow label="Did it pass RMS check?" value={answers.rms} onChange={answer('rms')} />
          </div>
        )}
        {showBattery && (
          <div className="py-3">
            <AnswerRow label="Is the battery good?" value={answers.battery} onChange={answer('battery')} />
          </div>
        )}
      </div>

      {/* Wholesale reason */}
      {needsReason && (
        <div className="flex flex-col gap-1.5 animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--danger-light)] border border-[var(--danger)]/15">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-xs font-semibold text-[var(--danger)]">Routing to Wholesale — reason required</span>
          </div>
          <textarea
            autoFocus
            value={wholesaleReason}
            onChange={(e) => setWholesaleReason(e.target.value)}
            placeholder="Describe why this device is being sent to wholesale…"
            rows={3}
            className="w-full px-4 py-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl placeholder-[var(--muted-light)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all resize-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#f2555a] to-[#e04449] hover:from-[#e04449] hover:to-[#cc3c42] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </form>
  );
}
