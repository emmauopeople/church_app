import { getAccessToken } from '../auth/auth.storage';
import { config } from '../../lib/config';
import type { Member, MemberFormValues, MemberStatus } from './members.types';

export type ListMembersParams = {
  search?: string;
  status?: MemberStatus;
  page?: number;
  limit?: number;
};

export type ListMembersResponse = {
  data: Member[];
  pagination: {
    page: number;
    limit: number;
    count: number;
    total: number;
    totalPages: number;
  };
};

type MemberResponse = {
  data: Member;
};

type CreateMemberResponse = MemberResponse & {
  message: string;
};

type UpdateMemberResponse = MemberResponse & {
  message: string;
};

type NextMemberCodeResponse = {
  data: {
    memberCode: string;
  };
};

function buildHeaders() {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildQuery(params: ListMembersParams) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
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

export async function listMembers(params: ListMembersParams = {}) {
  const response = await fetch(`${config.churchCoreApiUrl}/core/members${buildQuery(params)}`, {
    headers: buildHeaders(),
  });

  return parseResponse<ListMembersResponse>(response);
}

export async function listAllMembers(params: Omit<ListMembersParams, 'page' | 'limit'> = {}) {
  const limit = 100;
  const firstPage = await listMembers({ ...params, page: 1, limit });
  const members = [...firstPage.data];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const response = await listMembers({ ...params, page, limit });
    members.push(...response.data);
  }

  return members;
}

export async function getNextMemberCode() {
  const response = await fetch(`${config.churchCoreApiUrl}/core/members/next-code`, {
    headers: buildHeaders(),
  });

  return parseResponse<NextMemberCodeResponse>(response);
}

export async function getMember(memberId: string) {
  const response = await fetch(`${config.churchCoreApiUrl}/core/members/${memberId}`, {
    headers: buildHeaders(),
  });

  return parseResponse<MemberResponse>(response);
}

export async function createMember(payload: MemberFormValues) {
  const response = await fetch(`${config.churchCoreApiUrl}/core/members`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<CreateMemberResponse>(response);
}

export async function updateMember(memberId: string, payload: MemberFormValues) {
  const response = await fetch(`${config.churchCoreApiUrl}/core/members/${memberId}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<UpdateMemberResponse>(response);
}
