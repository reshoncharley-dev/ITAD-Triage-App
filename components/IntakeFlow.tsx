'use client';

import { useCallback, useRef, useState } from 'react';
import EntryStep from './EntryStep';
import QuestionStep from './QuestionStep';
import ResultCard from './ResultCard';
import SessionLog from './SessionLog';
import type { DeviceRecord, IntakeStep, RoutingDestination } from '@/types';

interface IntakeState {
  uuid: string;
  serial: string;
  diag: boolean | null;
  backMarket: boolean | null;
  rms: boolean | null;
  battery: boolean | null;
}

const EMPTY_STATE: IntakeState = {
  uuid: '',
  serial: '',
  diag: null,
  backMarket: null,
  rms: null,
  battery: null,
};

function resolveRouting(state: IntakeState): RoutingDestination {
  if (!state.diag || !state.backMarket) return 'Wholesale';
  if (!state.rms) return 'RMS Quarantine';
  if (!state.battery) return 'Battery Replacement';
  return 'Internal Resale';
}

const QUESTIONS: Record<string, string> = {
  diag: 'Did it pass diagnostics?',
  backmarket: 'Is it Back Market resalable?',
  rms: 'Did it pass RMS check?',
  battery: 'Is the battery good?',
};

const STEP_LABELS: Record<IntakeStep, string> = {
  entry: 'Device Entry',
  diag: 'Diagnostics',
  backmarket: 'Back Market',
  rms: 'RMS Check',
  battery: 'Battery',
  result: 'Result',
};

const STEPS: IntakeStep[] = ['entry', 'diag', 'backmarket', 'rms', 'battery', 'result'];

export default function IntakeFlow() {
  const [step, setStep] = useState<IntakeStep>('entry');
  const [intake, setIntake] = useState<IntakeState>(EMPTY_STATE);
  const [sessionLog, setSessionLog] = useState<DeviceRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const currentRecord = useRef<DeviceRecord | null>(null);

  const handleEntry = useCallback((uuid: string, serial: string) => {
    setIntake({ ...EMPTY_STATE, uuid, serial });
    setStep('diag');
  }, []);

  const handleDiag = useCallback((answer: boolean) => {
    const next = { ...intake, diag: answer };
    setIntake(next);
    if (!answer) finalize(next); else setStep('backmarket');
  }, [intake]);

  const handleBackMarket = useCallback((answer: boolean) => {
    const next = { ...intake, backMarket: answer };
    setIntake(next);
    if (!answer) finalize(next); else setStep('rms');
  }, [intake]);

  const handleRms = useCallback((answer: boolean) => {
    const next = { ...intake, rms: answer };
    setIntake(next);
    if (!answer) finalize(next); else setStep('battery');
  }, [intake]);

  const handleBattery = useCallback((answer: boolean) => {
    const next = { ...intake, battery: answer };
    setIntake(next);
    finalize(next);
  }, [intake]);

  function finalize(state: IntakeState) {
    const routing = resolveRouting(state);
    const record: DeviceRecord = {
      uuid: state.uuid,
      serial: state.serial,
      diag: state.diag,
      backMarket: state.backMarket,
      rms: state.rms,
      battery: state.battery,
      routing,
      timestamp: new Date().toISOString(),
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
    setIntake(EMPTY_STATE);
    currentRecord.current = null;
    setSyncError(null);
    setStep('entry');
  }

  const currentIndex = STEPS.indexOf(step);
  const progressSteps = STEPS.slice(0, -1); // exclude 'result' from bar

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Card */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-md overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-[#f2555a] via-[#f2555a]/70 to-[#f2555a]/20" />

        {/* Card header */}
        <div className="px-5 py-3.5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--background)] to-white flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {STEP_LABELS[step]}
          </p>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {progressSteps.map((s, i) => (
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

        {/* Card body */}
        <div className="p-5">
          {step === 'entry' && <EntryStep onSubmit={handleEntry} />}
          {step === 'diag' && <QuestionStep question={QUESTIONS.diag} onAnswer={handleDiag} />}
          {step === 'backmarket' && <QuestionStep question={QUESTIONS.backmarket} onAnswer={handleBackMarket} />}
          {step === 'rms' && <QuestionStep question={QUESTIONS.rms} onAnswer={handleRms} />}
          {step === 'battery' && <QuestionStep question={QUESTIONS.battery} onAnswer={handleBattery} />}
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
