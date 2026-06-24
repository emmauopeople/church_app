
import { config } from '../../lib/config';

export type ChurchDocument = {
  id: string;
  churchId: string;
  title: string;
  description?: string | null;
  category: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListDocumentsParams = {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type ListDocumentsResponse = {
  data: ChurchDocument[];
  pagination: {
    page: number;
    limit: number;
    count: number;
    total: number;
    totalPages: number;
  };
};

type UploadDocumentResponse = {
  message: string;
  data: ChurchDocument;
};

function buildAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function buildQuery(params: ListDocumentsParams) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
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

async function parseBlobResponse(response: Response): Promise<Blob> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return response.blob();
}

export async function listDocuments(params: ListDocumentsParams = {}) {
  const response = await fetch(`${config.documentApiUrl}/documents/files${buildQuery(params)}`, {
    headers: buildAuthHeaders(),
  });

  return parseResponse<ListDocumentsResponse>(response);
}

export async function uploadDocument(payload: {
  file: File;
  title: string;
  category: string;
  description?: string;
}) {
  const formData = new FormData();

  formData.append('file', payload.file);
  formData.append('title', payload.title);
  formData.append('category', payload.category);

  if (payload.description) {
    formData.append('description', payload.description);
  }

  const response = await fetch(`${config.documentApiUrl}/documents/files`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  });

  return parseResponse<UploadDocumentResponse>(response);
}

export async function previewDocument(documentId: string) {
  const response = await fetch(`${config.documentApiUrl}/documents/files/${documentId}/preview`, {
    headers: buildAuthHeaders(),
  });

  return parseBlobResponse(response);
}

export async function downloadDocument(documentId: string) {
  const response = await fetch(`${config.documentApiUrl}/documents/files/${documentId}/download`, {
    headers: buildAuthHeaders(),
  });

  return parseBlobResponse(response);
}
