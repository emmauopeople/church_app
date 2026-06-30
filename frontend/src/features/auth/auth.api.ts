import { config } from '../../lib/config';
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UpdateUserStatusRequest,
} from './auth.types';
import { getAccessToken } from './auth.storage';

function buildJsonHeaders() {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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

export async function listAuthUsers() {
  const response = await fetch(`${config.authApiUrl}/auth/users`, {
    headers: buildJsonHeaders(),
  });

  return parseResponse<ListUsersResponse>(response);
}

export async function createAuthUser(payload: CreateUserRequest) {
  const response = await fetch(`${config.authApiUrl}/auth/users`, {
    method: 'POST',
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<CreateUserResponse>(response);
}

export async function updateAuthUser(userId: string, payload: UpdateUserRequest) {
  const response = await fetch(`${config.authApiUrl}/auth/users/${userId}`, {
    method: 'PATCH',
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<UpdateUserResponse>(response);
}

export async function updateAuthUserStatus(userId: string, payload: UpdateUserStatusRequest) {
  const response = await fetch(`${config.authApiUrl}/auth/users/${userId}/status`, {
    method: 'PATCH',
    headers: buildJsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<UpdateUserResponse>(response);
}
