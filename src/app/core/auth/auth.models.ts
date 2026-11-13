export interface SessionUser {
  login: string;
  displayName: string;
  tenant: string;
  role: string;
}

export interface LoginRequest {
  tenant: string;
  login: string;
  password: string;
  clientId?: string;
}

export interface SessionView {
  authenticated: boolean;
  tenantCode?: string | null;
  userLogin?: string | null;
  clientId?: string | null;
}
