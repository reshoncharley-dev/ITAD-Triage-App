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
    if (e.key === 'Enter' && serial.trim()) {
      e.preventDefault();
      if (uuid.trim()) onSubmit(uuid.trim(), serial.trim());
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uuid.trim() && serial.trim()) onSubmit(uuid.trim(), serial.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          UUID
        </label>
        <input
          autoFocus
          type="text"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          onKeyDown={handleUuidKey}
          placeholder="Scan or type UUID…"
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-xl font-mono text-gray-900 placeholder-gray-300 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Serial Number
        </label>
        <input
          ref={serialRef}
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          onKeyDown={handleSerialKey}
          placeholder="Scan or type serial…"
          className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-xl font-mono text-gray-900 placeholder-gray-300 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!uuid.trim() || !serial.trim()}
        className="mt-2 w-full rounded-xl bg-blue-600 py-5 text-xl font-bold text-white transition hover:bg-blue-700 disabled:opacity-40"
      >
        Start Intake
      </button>
    </form>
  );
}
