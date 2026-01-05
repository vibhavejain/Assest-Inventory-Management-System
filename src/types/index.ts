// ============================================================================
// Core Type Definitions for Asset Inventory Management System
// ============================================================================

// Environment bindings for Cloudflare Worker
export interface Env {
  DB: D1Database;
}

// ============================================================================
// Entity Status Types
// ============================================================================

export type CompanyStatus = 'active' | 'inactive' | 'suspended';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AssetStatus = 'active' | 'inactive' | 'disposed' | 'maintenance';
export type AssetType = 'hardware' | 'software' | 'license' | 'other';
export type AccessRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'READ_ONLY';
export type EntityType = 'company' | 'user' | 'company_access' | 'asset';
export type AuditAction = 'create' | 'update' | 'delete';

// ============================================================================
// Database Entity Interfaces
// ============================================================================

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  primary_company_id: string | null;
  status: UserStatus;
  created_at: string;
}

export interface CompanyAccess {
  id: string;
  user_id: string;
  company_id: string;
  role: AccessRole;
  created_at: string;
}

export interface Asset {
  id: string;
  company_id: string;
  type: AssetType;
  name: string;
  identifier: string | null;
  status: AssetStatus;
  metadata: Record<string, unknown>;
  assigned_to: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string | null;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  changes: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// API Request DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateCompanyRequest {
  name: string;
  status?: CompanyStatus;
}

export interface UpdateCompanyRequest {
  name?: string;
  status?: CompanyStatus;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  primary_company_id?: string;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  primary_company_id?: string | null;
  status?: UserStatus;
}

export interface AddUserToCompanyRequest {
  user_id: string;
  role?: AccessRole;
}

export interface CreateAssetRequest {
  company_id: string;
  type: AssetType;
  name: string;
  identifier?: string;
  status?: AssetStatus;
  metadata?: Record<string, unknown>;
  assigned_to?: string;
}

export interface UpdateAssetRequest {
  type?: AssetType;
  name?: string;
  identifier?: string | null;
  status?: AssetStatus;
  metadata?: Record<string, unknown>;
  assigned_to?: string | null;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// Request Context (for future auth integration)
// ============================================================================

export interface RequestContext {
  userId?: string;
  companyId?: string;
  requestId: string;
  timestamp: string;
}

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

// ============================================================================
// Audit Log Entry (for creating audit records)
// ============================================================================

export interface AuditEntry {
  companyId: string;
  userId?: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
}
