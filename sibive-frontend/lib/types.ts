export interface Inspection {
  plate: string;
  date: number;
  coRalenti: number;
  coCrucero: number;
  hcRalenti: number;
  hcCrucero: number;
  co2Total: number;
  o2Total: number;
  opacity: number;
  tempMotor: number;
  rpmRalenti: number;
  rpmCrucero: number;
  emiteHumoContinuo: boolean;
  fugaEscape: boolean;
  faltaTapon: boolean;
  approved: boolean;
  isContaminant: boolean;
}

export interface VehicleSummary {
  plate: string;
  type: 0 | 1;
  label: string;
  modelYear: number;
}

export interface VehicleTypeInfo {
  type: 0 | 1;
  label: string;
  modelYear: number;
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
