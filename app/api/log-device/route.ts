import { NextRequest, NextResponse } from 'next/server';
import { appendDeviceRecord } from '@/lib/sheets';
import type { DeviceRecord } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const record: DeviceRecord = await req.json();
    await appendDeviceRecord(record);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sheets sync error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
