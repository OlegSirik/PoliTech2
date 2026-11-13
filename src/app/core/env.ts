export interface RuntimeEnv {
  API_BASE_URL?: string;
}

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

export function apiBaseUrl(): string {
  return window.__env?.API_BASE_URL ?? '';
}
