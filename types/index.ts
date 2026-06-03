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

export type BackMarketGrade = 'Mint' | 'Very Good' | 'Good' | 'Fair' | 'Stallone';

export interface DeviceRecord {
  uuid: string;
  serial: string;
  bricked: boolean | null;
  diag: boolean | null;
  backMarket: boolean | null;
  ebay: boolean | null;
  rms: boolean | null;
  battery: boolean | null;
  routing: RoutingDestination;
  wholesaleReason?: string;
  backMarketGrade?: BackMarketGrade;
  timestamp: string;
}
