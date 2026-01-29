export type NodeType =
  | "POLE"
  | "ODP"
  | "ODC"
  | "CABINET"
  | "SPLITTER"
  | "SLACK_LOOP"
<<<<<<< HEAD
  | "CUSTOMER"
  | "ISSUE";
=======
  | "CUSTOMER";
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb

export interface INodeMetadata {
  height?: number;
  capacity?: number;
  occupied_ports?: number;
  last_maintenance?: string;
  status?: "ACTIVE" | "MAINTENANCE" | "FAULTY";
  [key: string]: unknown;
}

export interface IGisNode {
  id: number;
  asset_id?: number | null;
  type: NodeType;
  lat: number;
  lng: number;
  metadata?: INodeMetadata;
  asset?: {
    name: string;
    status: string;
    ip_address?: string;
  };
}

export interface ILinkBudget {
  distance_km: number;
  estimated_loss_db: number;
  wavelength: string;
  calculation_date: string;
}

export interface IGisLink {
  id: number;
  source_node_id: number;
  target_node_id: number;
  cable_type?: string;
  path_geometry: [number, number][];
  total_distance_meters: number;
  metadata?: {
    core_count?: number;
    attenuation_db?: number;
    link_budget?: ILinkBudget;
    [key: string]: unknown;
  };
}

export interface INetworkAsset {
  id: number;
  asset_code?: string;
  name: string;
  asset_type: string;
  ip_address?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: string;
  department_id?: number;
  department?: {
    id: number;
    name: string;
  };
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface IAreaGroup {
  id: number;
  name: string;
  description?: string;
  color: string;
  bounds?: [number, number][];
  node_count?: number;
  total_cable_length?: number;
  center?: [number, number];
  created_by?: number;
  creator?: {
    id: number;
    name: string;
  };
}
export interface INetworkStandardValues {
  default_capacity?: number;
  [key: string]: unknown;
}

export interface INetworkStandard {
  config_key: string;
  config_value: INetworkStandardValues;
  [key: string]: unknown;
}
<<<<<<< HEAD

export interface ISpatialAnalysisResult {
  counts: {
    CUSTOMER: number;
    POLE: number;
    ODP: number;
  };
  suggestions: [number, number][];
  area_sqkm: number;
}
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
