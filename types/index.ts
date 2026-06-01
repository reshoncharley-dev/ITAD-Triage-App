export type RoutingDestination =
  | 'Wholesale'
  | 'RMS Quarantine'
  | 'Battery Replacement'
  | 'Internal Resale';

export type IntakeStep =
  | 'entry'
  | 'diag'
  | 'backmarket'
  | 'rms'
  | 'battery'
  | 'result';

export interface DeviceRecord {
  uuid: string;
  serial: string;
  diag: boolean | null;
  backMarket: boolean | null;
  rms: boolean | null;
  battery: boolean | null;
  routing: RoutingDestination;
  timestamp: string;
}
