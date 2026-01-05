// ============================================================================
// API Service Layer
// All functions to communicate with the backend API
// ============================================================================

import type {
  ApiResponse,
  Company,
  User,
  CompanyAccess,
  Asset,
  AuditLog,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CreateUserRequest,
  UpdateUserRequest,
  AddUserToCompanyRequest,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '../types';

// Base URL for the API - change this to your deployed backend URL
const API_BASE_URL = 'https://assest-inventory-management-system.vibhave.workers.dev';

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to the server',
      },
    };
  }
}

// ============================================================================
// Companies API
// ============================================================================

export async function getCompanies(params?: { limit?: number; offset?: number; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return apiFetch<Company[]>(`/companies${query ? `?${query}` : ''}`);
}

export async function getCompany(id: string) {
  return apiFetch<Company>(`/companies/${id}`);
}

export async function createCompany(data: CreateCompanyRequest) {
  return apiFetch<Company>('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompany(id: string, data: UpdateCompanyRequest) {
  return apiFetch<Company>(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCompany(id: string) {
  return apiFetch<void>(`/companies/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Users API
// ============================================================================

export async function getUsers(params?: { limit?: number; offset?: number; status?: string; company_id?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.company_id) searchParams.set('company_id', params.company_id);
  
  const query = searchParams.toString();
  return apiFetch<User[]>(`/users${query ? `?${query}` : ''}`);
}

export async function createUser(data: CreateUserRequest) {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: UpdateUserRequest) {
  return apiFetch<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  return apiFetch<void>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function getUserCompanies(userId: string) {
  return apiFetch<CompanyAccess[]>(`/users/${userId}/companies`);
}

export async function getUserAuditLogs(userId: string, params?: { limit?: number; offset?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  
  const query = searchParams.toString();
  return apiFetch<AuditLog[]>(`/users/${userId}/audit-logs${query ? `?${query}` : ''}`);
}

// ============================================================================
// Company Access API
// ============================================================================

export async function getCompanyUsers(companyId: string, params?: { limit?: number; offset?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  
  const query = searchParams.toString();
  return apiFetch<CompanyAccess[]>(`/companies/${companyId}/users${query ? `?${query}` : ''}`);
}

export async function addUserToCompany(companyId: string, data: AddUserToCompanyRequest) {
  return apiFetch<CompanyAccess>(`/companies/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeUserFromCompany(companyId: string, userId: string) {
  return apiFetch<void>(`/companies/${companyId}/users/${userId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Assets API
// ============================================================================

export async function getAssets(params?: { 
  limit?: number; 
  offset?: number; 
  company_id?: string;
  type?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.company_id) searchParams.set('company_id', params.company_id);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return apiFetch<Asset[]>(`/assets${query ? `?${query}` : ''}`);
}

export async function createAsset(data: CreateAssetRequest) {
  return apiFetch<Asset>('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAsset(id: string, data: UpdateAssetRequest) {
  return apiFetch<Asset>(`/assets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id: string) {
  return apiFetch<void>(`/assets/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Audit Logs API
// ============================================================================

export async function getAuditLogs(params: { 
  company_id: string;
  limit?: number; 
  offset?: number;
  entity_type?: string;
  action?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('company_id', params.company_id);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  if (params.entity_type) searchParams.set('entity_type', params.entity_type);
  if (params.action) searchParams.set('action', params.action);
  
  return apiFetch<AuditLog[]>(`/audit-logs?${searchParams.toString()}`);
}

// ============================================================================
// Health Check
// ============================================================================

export async function healthCheck() {
  return apiFetch<{ status: string; timestamp: string }>('/health');
}
