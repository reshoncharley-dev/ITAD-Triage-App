'use client';

import { useRef, useState } from 'react';

interface Props {
  onSubmit: (uuid: string, serial: string) => void;
}

export default function EntryStep({ onSubmit }: Props) {
  const [uuid, setUuid] = useState('');
  const [serial, setSerial] = useState('');
  const serialRef = useRef<HTMLInputElement>(null);

  function handleUuidKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && uuid.trim()) {
      e.preventDefault();
      serialRef.current?.focus();
    }
  }

  function handleSerialKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && serial.trim() && uuid.trim()) {
      e.preventDefault();
      onSubmit(uuid.trim(), serial.trim());
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uuid.trim() && serial.trim()) onSubmit(uuid.trim(), serial.trim());
  }

  const inputClass =
    'w-full px-4 py-3 text-sm font-mono tracking-wider bg-[var(--background)] border border-[var(--border)] rounded-xl placeholder-[var(--muted-light)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          UUID
        </label>
        <input
          autoFocus
          type="text"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          onKeyDown={handleUuidKey}
          placeholder="Scan or type UUID…"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Serial Number
        </label>
        <input
          ref={serialRef}
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          onKeyDown={handleSerialKey}
          placeholder="Scan or type serial…"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={!uuid.trim() || !serial.trim()}
        className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#f2555a] to-[#e04449] hover:from-[#e04449] hover:to-[#cc3c42] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start Intake
      </button>
    </form>
  );
}
