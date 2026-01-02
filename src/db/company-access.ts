// ============================================================================
// Company Access Database Operations
// ============================================================================

import type { CompanyAccess, AddUserToCompanyRequest, AccessRole } from '../types';
import { createAuditLog } from './audit';

export async function addUserToCompany(
  db: D1Database,
  companyId: string,
  data: AddUserToCompanyRequest,
  actingUserId?: string
): Promise<CompanyAccess> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const role = data.role || 'member';

  await db
    .prepare(
      `INSERT INTO company_access (id, user_id, company_id, role, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, data.user_id, companyId, role, createdAt)
    .run();

  const access: CompanyAccess = {
    id,
    user_id: data.user_id,
    company_id: companyId,
    role,
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
    .first<CompanyAccess>();

  return result || null;
}

export async function getCompanyAccessById(
  db: D1Database,
  id: string
): Promise<CompanyAccess | null> {
  const result = await db
    .prepare(`SELECT * FROM company_access WHERE id = ?`)
    .bind(id)
    .first<CompanyAccess>();

  return result || null;
}

export async function getUserCompanies(
  db: D1Database,
  userId: string
): Promise<CompanyAccess[]> {
  const result = await db
    .prepare(`SELECT * FROM company_access WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
    .all<CompanyAccess>();

  return result.results || [];
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
    params.push(role);
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
    .all<CompanyAccess>();

  return {
    access: accessResult.results || [],
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
