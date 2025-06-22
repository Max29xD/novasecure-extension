export interface KeyTypeProps {
  id: string;
  name: string;
}

export interface SessionProps {
  planName: string | undefined;
  id: string;
  name: string;
  emailVerified: boolean;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
  planId: string;
  banned: boolean | null | undefined;
  role?: string | null | undefined;
  banReason?: string | null | undefined;
  banExpires?: Date | null | undefined;
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