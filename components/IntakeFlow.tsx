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
    setIntake((prev) => ({ ...prev, diag: answer }));
    if (!answer) {
      finalize({ ...intake, diag: answer });
    } else {
      setStep('backmarket');
    }
  }, [intake]);

  const handleBackMarket = useCallback((answer: boolean) => {
    setIntake((prev) => ({ ...prev, backMarket: answer }));
    if (!answer) {
      finalize({ ...intake, backMarket: answer });
    } else {
      setStep('rms');
    }
  }, [intake]);

  const handleRms = useCallback((answer: boolean) => {
    setIntake((prev) => ({ ...prev, rms: answer }));
    if (!answer) {
      finalize({ ...intake, rms: answer });
    } else {
      setStep('battery');
    }
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
      .then((data) => {
        if (!data.ok) setSyncError(data.error ?? 'Unknown error');
      })
      .catch((err) => setSyncError(String(err)))
      .finally(() => setSyncing(false));
  }

  function handleNext() {
    setIntake(EMPTY_STATE);
    currentRecord.current = null;
    setSyncError(null);
    setStep('entry');
  }

  const STEP_LABELS: Record<IntakeStep, string> = {
    entry: 'Device Entry',
    diag: 'Diagnostics',
    backmarket: 'Back Market',
    rms: 'RMS Check',
    battery: 'Battery',
    result: 'Result',
  };

  const STEPS: IntakeStep[] = ['entry', 'diag', 'backmarket', 'rms', 'battery', 'result'];
  const currentIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 text-3xl font-black text-gray-900">Device Intake</h1>

      <div className="mb-8 flex gap-1">
        {STEPS.slice(0, -1).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < currentIndex ? 'bg-blue-600' : i === currentIndex ? 'bg-blue-300' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {STEP_LABELS[step]}
      </p>

      {step === 'entry' && <EntryStep onSubmit={handleEntry} />}

      {step === 'diag' && (
        <QuestionStep question="Did it pass diagnostics?" onAnswer={handleDiag} />
      )}
      {step === 'backmarket' && (
        <QuestionStep question="Is it Back Market resalable?" onAnswer={handleBackMarket} />
      )}
      {step === 'rms' && (
        <QuestionStep question="Did it pass RMS check?" onAnswer={handleRms} />
      )}
      {step === 'battery' && (
        <QuestionStep question="Is the battery good?" onAnswer={handleBattery} />
      )}

      {step === 'result' && currentRecord.current && (
        <ResultCard
          record={currentRecord.current}
          syncing={syncing}
          syncError={syncError}
          onNext={handleNext}
        />
      )}

      <SessionLog records={sessionLog} />
    </div>
  );
}
