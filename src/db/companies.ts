// ============================================================================
// Companies Database Operations
// ============================================================================

import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types';
import { createAuditLog } from './audit';

export async function createCompany(
  db: D1Database,
  data: CreateCompanyRequest,
  userId?: string
): Promise<Company> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const status = data.status || 'active';

  await db
    .prepare(
      `INSERT INTO companies (id, name, status, created_at) VALUES (?, ?, ?, ?)`
    )
    .bind(id, data.name.trim(), status, createdAt)
    .run();

  const company: Company = {
    id,
    name: data.name.trim(),
    status,
    created_at: createdAt,
  };

  await createAuditLog(db, {
    companyId: id,
    userId,
    entityType: 'company',
    entityId: id,
    action: 'create',
    changes: { created: company },
  });

  return company;
}

export async function getCompanyById(
  db: D1Database,
  id: string
): Promise<Company | null> {
  const result = await db
    .prepare(`SELECT * FROM companies WHERE id = ?`)
    .bind(id)
    .first<Company>();

  return result || null;
}

export async function getCompanyByName(
  db: D1Database,
  name: string
): Promise<Company | null> {
  const result = await db
    .prepare(`SELECT * FROM companies WHERE name = ? COLLATE NOCASE`)
    .bind(name.trim())
    .first<Company>();

  return result || null;
}

export async function getAllCompanies(
  db: D1Database,
  options: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ companies: Company[]; total: number }> {
  const { limit = 50, offset = 0, status } = options;

  let whereClause = '';
  const params: (string | number)[] = [];

  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM companies ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count || 0;

  const companiesResult = await db
    .prepare(
      `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<Company>();

  return {
    companies: companiesResult.results || [],
    total,
  };
}

export async function updateCompany(
  db: D1Database,
  id: string,
  data: UpdateCompanyRequest,
  userId?: string
): Promise<Company | null> {
  const existing = await getCompanyById(db, id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | null)[] = [];
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name.trim());
    changes.name = { from: existing.name, to: data.name.trim() };
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
    changes.status = { from: existing.status, to: data.status };
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);

  await db
    .prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getCompanyById(db, id);

  if (updated) {
    await createAuditLog(db, {
      companyId: id,
      userId,
      entityType: 'company',
      entityId: id,
      action: 'update',
      changes,
    });
  }

  return updated;
}

export async function companyExists(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`SELECT 1 FROM companies WHERE id = ?`)
    .bind(id)
    .first();

  return result !== null;
}

export async function deleteCompany(
  db: D1Database,
  id: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const existing = await getCompanyById(db, id);
  if (!existing) {
    return { success: false, error: 'Company not found' };
  }

  // Check if company has any audit logs beyond creation
  const auditCount = await db
    .prepare(
      `SELECT COUNT(*) as count FROM audit_logs 
       WHERE company_id = ? AND action != 'create'`
    )
    .bind(id)
    .first<{ count: number }>();

  if (auditCount && auditCount.count > 0) {
    return { success: false, error: 'Cannot delete company with activity history' };
  }

  // Delete company access records
  await db
    .prepare(`DELETE FROM company_access WHERE company_id = ?`)
    .bind(id)
    .run();

  // Delete assets for this company
  await db
    .prepare(`DELETE FROM assets WHERE company_id = ?`)
    .bind(id)
    .run();

  // Delete audit logs for this company
  await db
    .prepare(`DELETE FROM audit_logs WHERE company_id = ?`)
    .bind(id)
    .run();

  // Delete the company
  await db
    .prepare(`DELETE FROM companies WHERE id = ?`)
    .bind(id)
    .run();

  return { success: true };
}
