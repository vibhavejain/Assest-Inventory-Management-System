// ============================================================================
// Company Access Database Operations
// ============================================================================

import type { CompanyAccess, AddUserToCompanyRequest, AccessRole } from '../types';
import { createAuditLog } from './audit';

// Map lowercase DB roles to uppercase API roles
const ROLE_MAP: Record<string, AccessRole> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  member: 'MEMBER',
  viewer: 'READ_ONLY',
};

function normalizeRole(dbRole: string): AccessRole {
  return ROLE_MAP[dbRole.toLowerCase()] || 'MEMBER';
}

export async function addUserToCompany(
  db: D1Database,
  companyId: string,
  data: AddUserToCompanyRequest,
  actingUserId?: string
): Promise<CompanyAccess> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  // Convert uppercase role to lowercase for database storage (DB constraint uses lowercase)
  const roleInput = data.role || 'MEMBER';
  const dbRole = roleInput.toLowerCase();

  await db
    .prepare(
      `INSERT INTO company_access (id, user_id, company_id, role, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, data.user_id, companyId, dbRole, createdAt)
    .run();

  const access: CompanyAccess = {
    id,
    user_id: data.user_id,
    company_id: companyId,
    role: roleInput,
    created_at: createdAt,
  };

  await createAuditLog(db, {
    companyId,
    userId: actingUserId,
    entityType: 'company_access',
    entityId: id,
    action: 'create',
    changes: { created: access },
  });

  return access;
}

export async function removeUserFromCompany(
  db: D1Database,
  companyId: string,
  userId: string,
  actingUserId?: string
): Promise<boolean> {
  const existing = await getCompanyAccess(db, companyId, userId);
  if (!existing) {
    return false;
  }

  await db
    .prepare(`DELETE FROM company_access WHERE company_id = ? AND user_id = ?`)
    .bind(companyId, userId)
    .run();

  await createAuditLog(db, {
    companyId,
    userId: actingUserId,
    entityType: 'company_access',
    entityId: existing.id,
    action: 'delete',
    changes: { deleted: existing },
  });

  return true;
}

export async function getCompanyAccess(
  db: D1Database,
  companyId: string,
  userId: string
): Promise<CompanyAccess | null> {
  const result = await db
    .prepare(
      `SELECT * FROM company_access WHERE company_id = ? AND user_id = ?`
    )
    .bind(companyId, userId)
    .first<CompanyAccess & { role: string }>();

  if (!result) return null;
  return { ...result, role: normalizeRole(result.role) };
}

export async function getCompanyAccessById(
  db: D1Database,
  id: string
): Promise<CompanyAccess | null> {
  const result = await db
    .prepare(`SELECT * FROM company_access WHERE id = ?`)
    .bind(id)
    .first<CompanyAccess & { role: string }>();

  if (!result) return null;
  return { ...result, role: normalizeRole(result.role) };
}

export async function getUserCompanies(
  db: D1Database,
  userId: string
): Promise<CompanyAccess[]> {
  const result = await db
    .prepare(`SELECT * FROM company_access WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
    .all<CompanyAccess & { role: string }>();

  return (result.results || []).map((row) => ({ ...row, role: normalizeRole(row.role) }));
}

export async function getCompanyUsers(
  db: D1Database,
  companyId: string,
  options: { limit?: number; offset?: number; role?: AccessRole } = {}
): Promise<{ access: CompanyAccess[]; total: number }> {
  const { limit = 50, offset = 0, role } = options;

  let whereClause = 'WHERE company_id = ?';
  const params: (string | number)[] = [companyId];

  if (role) {
    whereClause += ' AND role = ?';
    // Convert uppercase API role to lowercase for DB query
    params.push(role.toLowerCase());
  }

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM company_access ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count || 0;

  const accessResult = await db
    .prepare(
      `SELECT * FROM company_access ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<CompanyAccess & { role: string }>();

  // Normalize roles from lowercase DB format to uppercase API format
  const access = (accessResult.results || []).map((row) => ({
    ...row,
    role: normalizeRole(row.role),
  }));

  return {
    access,
    total,
  };
}

export async function companyAccessExists(
  db: D1Database,
  companyId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `SELECT 1 FROM company_access WHERE company_id = ? AND user_id = ?`
    )
    .bind(companyId, userId)
    .first();

  return result !== null;
}
