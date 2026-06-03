'use client';

import { useRef, useState } from 'react';
import EntryStep from './EntryStep';
import TriageForm, { type TriageAnswers } from './TriageForm';
import ResultCard from './ResultCard';
import SessionLog from './SessionLog';
import type { BackMarketGrade, DeviceRecord, RoutingDestination } from '@/types';

type Step = 'entry' | 'triage' | 'result';

function resolveRouting(a: TriageAnswers): RoutingDestination {
  if (a.bricked) return 'Wholesale';
  if (!a.diag) {
    if (!a.battery) return 'Wholesale';
    return a.rms ? 'Battery Replacement' : 'RMS Quarantine';
  }
  if (!a.backMarket && !a.ebay) return 'Wholesale';
  if (!a.rms) return 'RMS Quarantine';
  if (!a.battery) return 'Battery Replacement';
  return 'Internal Resale';
}

const STEP_LABELS: Record<Step, string> = {
  entry: 'Device Entry',
  triage: 'Triage',
  result: 'Result',
};

export default function IntakeFlow() {
  const [step, setStep] = useState<Step>('entry');
  const [device, setDevice] = useState({ uuid: '', serial: '' });
  const [sessionLog, setSessionLog] = useState<DeviceRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const currentRecord = useRef<DeviceRecord | null>(null);

  function handleEntry(uuid: string, serial: string) {
    setDevice({ uuid, serial });
    setStep('triage');
  }

  function handleTriage(answers: TriageAnswers, wholesaleReason?: string, backMarketGrade?: BackMarketGrade) {
    const routing = resolveRouting(answers);
    const record: DeviceRecord = {
      uuid: device.uuid,
      serial: device.serial,
      bricked: answers.bricked,
      diag: answers.diag,
      backMarket: answers.backMarket,
      ebay: answers.ebay,
      rms: answers.rms,
      battery: answers.battery,
      routing,
      wholesaleReason,
      backMarketGrade,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Denver' }),
    };

    currentRecord.current = record;
    setSessionLog((prev) => [...prev, record]);
    setSyncing(true);
    setSyncError(null);
    setStep('result');

    fetch('/api/log-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
      .then((res) => res.json())
      .then((data) => { if (!data.ok) setSyncError(data.error ?? 'Unknown error'); })
      .catch((err) => setSyncError(String(err)))
      .finally(() => setSyncing(false));
  }

  function handleNext() {
    currentRecord.current = null;
    setSyncError(null);
    setStep('entry');
  }

  const STEPS: Step[] = ['entry', 'triage', 'result'];
  const currentIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#f2555a] via-[#f2555a]/70 to-[#f2555a]/20" />

        <div className="px-5 py-3.5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--background)] to-white flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {STEP_LABELS[step]}
          </p>
          <div className="flex items-center gap-1.5">
            {STEPS.slice(0, -1).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i < currentIndex
                    ? 'w-4 bg-[var(--primary)]'
                    : i === currentIndex
                    ? 'w-4 bg-[var(--primary)]/40'
                    : 'w-1.5 bg-[var(--border-strong)]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          {step === 'entry' && <EntryStep onSubmit={handleEntry} />}
          {step === 'triage' && (
            <TriageForm
              uuid={device.uuid}
              serial={device.serial}
              onSubmit={handleTriage}
            />
          )}
          {step === 'result' && currentRecord.current && (
            <ResultCard
              record={currentRecord.current}
              syncing={syncing}
              syncError={syncError}
              onNext={handleNext}
            />
          )}
        </div>
      </div>

      <SessionLog records={sessionLog} />
    </div>
  );
}
