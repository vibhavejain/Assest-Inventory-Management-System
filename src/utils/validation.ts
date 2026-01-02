// ============================================================================
// Input Validation Utilities
// ============================================================================

import type {
  ValidationResult,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CreateUserRequest,
  UpdateUserRequest,
  AddUserToCompanyRequest,
  CreateAssetRequest,
  UpdateAssetRequest,
  CompanyStatus,
  UserStatus,
  AssetStatus,
  AssetType,
  AccessRole,
} from '../types';

const COMPANY_STATUSES: CompanyStatus[] = ['active', 'inactive', 'suspended'];
const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];
const ASSET_STATUSES: AssetStatus[] = ['active', 'inactive', 'disposed', 'maintenance'];
const ASSET_TYPES: AssetType[] = ['hardware', 'software', 'license', 'other'];
const ACCESS_ROLES: AccessRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'READ_ONLY'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createResult(): ValidationResult {
  return { valid: true, errors: {} };
}

function addError(result: ValidationResult, field: string, message: string): void {
  result.valid = false;
  if (!result.errors[field]) {
    result.errors[field] = [];
  }
  result.errors[field].push(message);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUUID(value: unknown): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
}

// ============================================================================
// Company Validation
// ============================================================================

export function validateCreateCompany(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;

  if (!isNonEmptyString(body.name)) {
    addError(result, 'name', 'Name is required and must be a non-empty string');
  } else if (body.name.length > 255) {
    addError(result, 'name', 'Name must be 255 characters or less');
  }

  if (body.status !== undefined) {
    if (!COMPANY_STATUSES.includes(body.status as CompanyStatus)) {
      addError(result, 'status', `Status must be one of: ${COMPANY_STATUSES.join(', ')}`);
    }
  }

  return result;
}

export function validateUpdateCompany(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;

  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) {
      addError(result, 'name', 'Name must be a non-empty string');
    } else if (body.name.length > 255) {
      addError(result, 'name', 'Name must be 255 characters or less');
    }
  }

  if (body.status !== undefined) {
    if (!COMPANY_STATUSES.includes(body.status as CompanyStatus)) {
      addError(result, 'status', `Status must be one of: ${COMPANY_STATUSES.join(', ')}`);
    }
  }

  if (body.name === undefined && body.status === undefined) {
    addError(result, '_root', 'At least one field must be provided for update');
  }

  return result;
}

// ============================================================================
// User Validation
// ============================================================================

export function validateCreateUser(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;

  if (!isNonEmptyString(body.email)) {
    addError(result, 'email', 'Email is required');
  } else if (!isValidEmail(body.email)) {
    addError(result, 'email', 'Email must be a valid email address');
  }

  if (!isNonEmptyString(body.name)) {
    addError(result, 'name', 'Name is required and must be a non-empty string');
  } else if (body.name.length > 255) {
    addError(result, 'name', 'Name must be 255 characters or less');
  }

  if (body.primary_company_id !== undefined && body.primary_company_id !== null) {
    if (!isValidUUID(body.primary_company_id)) {
      addError(result, 'primary_company_id', 'Primary company ID must be a valid UUID');
    }
  }

  if (body.status !== undefined) {
    if (!USER_STATUSES.includes(body.status as UserStatus)) {
      addError(result, 'status', `Status must be one of: ${USER_STATUSES.join(', ')}`);
    }
  }

  return result;
}

export function validateUpdateUser(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;
  let hasUpdate = false;

  if (body.email !== undefined) {
    hasUpdate = true;
    if (!isNonEmptyString(body.email)) {
      addError(result, 'email', 'Email must be a non-empty string');
    } else if (!isValidEmail(body.email)) {
      addError(result, 'email', 'Email must be a valid email address');
    }
  }

  if (body.name !== undefined) {
    hasUpdate = true;
    if (!isNonEmptyString(body.name)) {
      addError(result, 'name', 'Name must be a non-empty string');
    } else if (body.name.length > 255) {
      addError(result, 'name', 'Name must be 255 characters or less');
    }
  }

  if (body.primary_company_id !== undefined) {
    hasUpdate = true;
    if (body.primary_company_id !== null && !isValidUUID(body.primary_company_id)) {
      addError(result, 'primary_company_id', 'Primary company ID must be a valid UUID or null');
    }
  }

  if (body.status !== undefined) {
    hasUpdate = true;
    if (!USER_STATUSES.includes(body.status as UserStatus)) {
      addError(result, 'status', `Status must be one of: ${USER_STATUSES.join(', ')}`);
    }
  }

  if (!hasUpdate) {
    addError(result, '_root', 'At least one field must be provided for update');
  }

  return result;
}

// ============================================================================
// Company Access Validation
// ============================================================================

export function validateAddUserToCompany(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;

  if (!isValidUUID(body.user_id)) {
    addError(result, 'user_id', 'User ID is required and must be a valid UUID');
  }

  if (body.role !== undefined) {
    if (!ACCESS_ROLES.includes(body.role as AccessRole)) {
      addError(result, 'role', `Role must be one of: ${ACCESS_ROLES.join(', ')}`);
    }
  }

  return result;
}

// ============================================================================
// Asset Validation
// ============================================================================

export function validateCreateAsset(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;

  if (!isValidUUID(body.company_id)) {
    addError(result, 'company_id', 'Company ID is required and must be a valid UUID');
  }

  if (!ASSET_TYPES.includes(body.type as AssetType)) {
    addError(result, 'type', `Type is required and must be one of: ${ASSET_TYPES.join(', ')}`);
  }

  if (!isNonEmptyString(body.name)) {
    addError(result, 'name', 'Name is required and must be a non-empty string');
  } else if (body.name.length > 255) {
    addError(result, 'name', 'Name must be 255 characters or less');
  }

  if (body.identifier !== undefined && body.identifier !== null) {
    if (typeof body.identifier !== 'string') {
      addError(result, 'identifier', 'Identifier must be a string');
    } else if (body.identifier.length > 255) {
      addError(result, 'identifier', 'Identifier must be 255 characters or less');
    }
  }

  if (body.status !== undefined) {
    if (!ASSET_STATUSES.includes(body.status as AssetStatus)) {
      addError(result, 'status', `Status must be one of: ${ASSET_STATUSES.join(', ')}`);
    }
  }

  if (body.metadata !== undefined) {
    if (typeof body.metadata !== 'object' || body.metadata === null || Array.isArray(body.metadata)) {
      addError(result, 'metadata', 'Metadata must be a JSON object');
    }
  }

  return result;
}

export function validateUpdateAsset(data: unknown): ValidationResult {
  const result = createResult();

  if (!data || typeof data !== 'object') {
    addError(result, '_root', 'Request body must be an object');
    return result;
  }

  const body = data as Record<string, unknown>;
  let hasUpdate = false;

  if (body.type !== undefined) {
    hasUpdate = true;
    if (!ASSET_TYPES.includes(body.type as AssetType)) {
      addError(result, 'type', `Type must be one of: ${ASSET_TYPES.join(', ')}`);
    }
  }

  if (body.name !== undefined) {
    hasUpdate = true;
    if (!isNonEmptyString(body.name)) {
      addError(result, 'name', 'Name must be a non-empty string');
    } else if (body.name.length > 255) {
      addError(result, 'name', 'Name must be 255 characters or less');
    }
  }

  if (body.identifier !== undefined) {
    hasUpdate = true;
    if (body.identifier !== null && typeof body.identifier !== 'string') {
      addError(result, 'identifier', 'Identifier must be a string or null');
    } else if (typeof body.identifier === 'string' && body.identifier.length > 255) {
      addError(result, 'identifier', 'Identifier must be 255 characters or less');
    }
  }

  if (body.status !== undefined) {
    hasUpdate = true;
    if (!ASSET_STATUSES.includes(body.status as AssetStatus)) {
      addError(result, 'status', `Status must be one of: ${ASSET_STATUSES.join(', ')}`);
    }
  }

  if (body.metadata !== undefined) {
    hasUpdate = true;
    if (typeof body.metadata !== 'object' || body.metadata === null || Array.isArray(body.metadata)) {
      addError(result, 'metadata', 'Metadata must be a JSON object');
    }
  }

  if (!hasUpdate) {
    addError(result, '_root', 'At least one field must be provided for update');
  }

  return result;
}

// ============================================================================
// Query Parameter Validation
// ============================================================================

export function validateUUID(value: string | null, fieldName: string): ValidationResult {
  const result = createResult();
  if (!value) {
    addError(result, fieldName, `${fieldName} is required`);
  } else if (!isValidUUID(value)) {
    addError(result, fieldName, `${fieldName} must be a valid UUID`);
  }
  return result;
}

export function validateOptionalUUID(value: string | null, fieldName: string): ValidationResult {
  const result = createResult();
  if (value !== null && !isValidUUID(value)) {
    addError(result, fieldName, `${fieldName} must be a valid UUID`);
  }
  return result;
}

// ============================================================================
// Type Guards for validated data
// ============================================================================

export function asCreateCompanyRequest(data: unknown): CreateCompanyRequest {
  const d = data as Record<string, unknown>;
  return {
    name: d.name as string,
    status: d.status as CompanyStatus | undefined,
  };
}

export function asUpdateCompanyRequest(data: unknown): UpdateCompanyRequest {
  const d = data as Record<string, unknown>;
  return {
    name: d.name as string | undefined,
    status: d.status as CompanyStatus | undefined,
  };
}

export function asCreateUserRequest(data: unknown): CreateUserRequest {
  const d = data as Record<string, unknown>;
  return {
    email: d.email as string,
    name: d.name as string,
    primary_company_id: d.primary_company_id as string | undefined,
    status: d.status as UserStatus | undefined,
  };
}

export function asUpdateUserRequest(data: unknown): UpdateUserRequest {
  const d = data as Record<string, unknown>;
  return {
    email: d.email as string | undefined,
    name: d.name as string | undefined,
    primary_company_id: d.primary_company_id as string | null | undefined,
    status: d.status as UserStatus | undefined,
  };
}

export function asAddUserToCompanyRequest(data: unknown): AddUserToCompanyRequest {
  const d = data as Record<string, unknown>;
  return {
    user_id: d.user_id as string,
    role: d.role as AccessRole | undefined,
  };
}

export function asCreateAssetRequest(data: unknown): CreateAssetRequest {
  const d = data as Record<string, unknown>;
  return {
    company_id: d.company_id as string,
    type: d.type as AssetType,
    name: d.name as string,
    identifier: d.identifier as string | undefined,
    status: d.status as AssetStatus | undefined,
    metadata: d.metadata as Record<string, unknown> | undefined,
  };
}

export function asUpdateAssetRequest(data: unknown): UpdateAssetRequest {
  const d = data as Record<string, unknown>;
  return {
    type: d.type as AssetType | undefined,
    name: d.name as string | undefined,
    identifier: d.identifier as string | null | undefined,
    status: d.status as AssetStatus | undefined,
    metadata: d.metadata as Record<string, unknown> | undefined,
  };
}
