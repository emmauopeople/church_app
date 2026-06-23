import { config } from '../../lib/config';
import type { LoginRequest, LoginResponse, MeResponse } from './auth.types';
import { getAccessToken } from './auth.storage';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function login(payload: LoginRequest) {
  const response = await fetch(`${config.authApiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse<LoginResponse>(response);
}

export async function getCurrentUser() {
  const token = getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const response = await fetch(`${config.authApiUrl}/auth/me`, { headers });

  return parseResponse<MeResponse>(response);
}
