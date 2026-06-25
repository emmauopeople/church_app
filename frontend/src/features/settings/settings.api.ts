import { config } from '../../lib/config';
import { getAccessToken } from '../auth/auth.storage';

export type AuthAuditLog = {
  id: string;
  churchId: string | null;
  userId: string | null;
  email: string | null;
  action: string;
  status: string;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type CertificateAuditLog = {
  id: string;
  churchId: string;
  action: string;
  documentType: string;
  referenceEntityType: string;
  referenceEntityId: string;
  generatedBy: string;
  fileName: string | null;
  createdAt: string;
};

type ListAuditResponse<T> = {
  data: T[];
};

export type ServiceMetricSnapshot = {
  id: string;
  label: string;
  url: string;
  status: 'ok' | 'unavailable';
  cpuSeconds?: number;
  memoryRssMb?: number;
  heapUsedMb?: number;
  heapTotalMb?: number;
  requestsTotal?: number;
  error?: string;
};

const serviceTargets = [
  { id: 'auth', label: 'Auth service', url: config.authApiUrl },
  { id: 'core', label: 'Church core service', url: config.churchCoreApiUrl },
  { id: 'document', label: 'Document service', url: config.documentApiUrl },
];

function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

function readMetricValue(metrics: string, name: string) {
  const line = metrics
    .split('\n')
    .find((item) => item.startsWith(`${name} `));

  if (!line) return undefined;

  const value = Number(line.trim().split(/\s+/).at(-1));
  return Number.isFinite(value) ? value : undefined;
}

function sumMetricValues(metrics: string, name: string) {
  const total = metrics
    .split('\n')
    .filter((line) => line.startsWith(`${name}{`) || line.startsWith(`${name} `))
    .reduce((sum, line) => {
      const value = Number(line.trim().split(/\s+/).at(-1));
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

  return total > 0 ? total : undefined;
}

function bytesToMb(value?: number) {
  if (value === undefined) return undefined;
  return value / (1024 * 1024);
}

function parseMetrics(target: (typeof serviceTargets)[number], metrics: string): ServiceMetricSnapshot {
  const cpuUserSeconds = readMetricValue(metrics, 'process_cpu_user_seconds_total') ?? 0;
  const cpuSystemSeconds = readMetricValue(metrics, 'process_cpu_system_seconds_total') ?? 0;

  return {
    ...target,
    status: 'ok',
    cpuSeconds: cpuUserSeconds + cpuSystemSeconds,
    memoryRssMb: bytesToMb(readMetricValue(metrics, 'process_resident_memory_bytes')),
    heapUsedMb: bytesToMb(readMetricValue(metrics, 'nodejs_heap_size_used_bytes')),
    heapTotalMb: bytesToMb(readMetricValue(metrics, 'nodejs_heap_size_total_bytes')),
    requestsTotal: sumMetricValues(metrics, 'http_requests_total'),
  };
}

async function loadServiceMetrics(target: (typeof serviceTargets)[number]): Promise<ServiceMetricSnapshot> {
  try {
    const response = await fetch(`${target.url}/metrics`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return parseMetrics(target, await response.text());
  } catch (error) {
    return {
      ...target,
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'Metrics unavailable',
    };
  }
}

export async function listAuthAuditLogs() {
  const response = await fetch(`${config.authApiUrl}/auth/audit-logs`, {
    headers: buildAuthHeaders(),
  });

  return parseResponse<ListAuditResponse<AuthAuditLog>>(response);
}

export async function listCertificateAuditLogs() {
  const response = await fetch(`${config.documentApiUrl}/documents/certificates/audit-logs`, {
    headers: buildAuthHeaders(),
  });

  return parseResponse<ListAuditResponse<CertificateAuditLog>>(response);
}

export async function loadSystemMetrics() {
  return Promise.all(serviceTargets.map(loadServiceMetrics));
}
