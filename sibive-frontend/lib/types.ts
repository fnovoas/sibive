export interface Inspection {
  plate: string;
  date: number;
  co: number;
  hc: number;
  opacity: number;
  approved: boolean;
  isContaminant: boolean;
}

export interface VehicleTypeInfo {
  type: 0 | 1;
  label: string;
  fields: string[];
}

export interface BlockSummary {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  transactionCount: number;
  gasUsed: number;
  gasLimit: number;
}

export interface BlocksResponse {
  latest: number;
  count: number;
  blocks: BlockSummary[];
}

export interface ApiErrorBody {
  error?: string;
}
