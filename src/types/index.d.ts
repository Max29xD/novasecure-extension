export interface KeyTypeProps {
  id: string;
  name: string;
}

export interface SessionProps {
  planType: string;
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

export type Endpoints =
  | "/password"
  | "/password/save"
  | "/keytype"
  | "/status"
  | "/session";

export interface CacheData {
  session: SessionProps | null;
  status: string;
  keyTypes: KeyTypeProps[];
  lastUpdate: number;
}