import { config } from '../../lib/config';
import { getAccessToken } from '../auth/auth.storage';
import type { CreateSacramentPayload, Sacrament, SacramentType } from './sacraments.types';

type ListSacramentTypesResponse = {
  data: SacramentType[];
};

type ListSacramentsResponse = {
  data: Sacrament[];
  pagination: {
    page: number;
    limit: number;
    count: number;
  };
};

type CreateSacramentResponse = {
  message: string;
  data: Sacrament;
};

type ListSacramentsParams = {
  memberId?: string;
  sacramentTypeId?: number;
  page?: number;
  limit?: number;
};

function buildHeaders() {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildQuery(params: ListSacramentsParams) {
  const searchParams = new URLSearchParams();

  if (params.sacramentTypeId) searchParams.set('sacramentTypeId', String(params.sacramentTypeId));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function listSacramentTypes() {
  const response = await fetch(`${config.churchCoreApiUrl}/core/sacrament-types`, {
    headers: buildHeaders(),
  });

  return parseResponse<ListSacramentTypesResponse>(response);
}

export async function listSacraments(params: ListSacramentsParams = {}) {
  const basePath = params.memberId
    ? `${config.churchCoreApiUrl}/core/members/${params.memberId}/sacraments`
    : `${config.churchCoreApiUrl}/core/sacraments`;

  const response = await fetch(`${basePath}${buildQuery(params)}`, {
    headers: buildHeaders(),
  });

  return parseResponse<ListSacramentsResponse>(response);
}

export async function createSacrament(payload: CreateSacramentPayload) {
  const response = await fetch(`${config.churchCoreApiUrl}/core/sacraments`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<CreateSacramentResponse>(response);
}
