export type RoutingDestination =
  | 'Wholesale'
  | 'RMS Quarantine'
  | 'Battery Replacement'
  | 'Internal Resale';

export type IntakeStep =
  | 'entry'
  | 'bricked'
  | 'diag'
  | 'backmarket'
  | 'rms'
  | 'battery'
  | 'wholesale-reason'
  | 'result';

export interface DeviceRecord {
  uuid: string;
  serial: string;
  bricked: boolean | null;
  diag: boolean | null;
  backMarket: boolean | null;
  rms: boolean | null;
  battery: boolean | null;
  routing: RoutingDestination;
  wholesaleReason?: string;
  timestamp: string;
}
