// ============================================================================
// Audit Logging Service
// Immutable audit trail for all mutations
// ============================================================================

import type { Env, AuditEntry, AuditLog, EntityType, AuditAction } from '../types';

export async function createAuditLog(
  db: D1Database,
  entry: AuditEntry
): Promise<AuditLog> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const changesJson = JSON.stringify(entry.changes || {});

  await db
    .prepare(
      `INSERT INTO audit_logs (id, company_id, user_id, entity_type, entity_id, action, changes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      entry.companyId,
      entry.userId || null,
      entry.entityType,
      entry.entityId,
      entry.action,
      changesJson,
      createdAt
    )
    .run();

  return {
    id,
    company_id: entry.companyId,
    user_id: entry.userId || null,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    changes: entry.changes || {},
    created_at: createdAt,
  };
}

export async function getAuditLogsByCompany(
  db: D1Database,
  companyId: string,
  options: {
    limit?: number;
    offset?: number;
    entityType?: EntityType;
    action?: AuditAction;
  } = {}
): Promise<{ logs: AuditLog[]; total: number }> {
  const { limit = 50, offset = 0, entityType, action } = options;

  let whereClause = 'WHERE company_id = ?';
  const params: (string | number)[] = [companyId];

  if (entityType) {
    whereClause += ' AND entity_type = ?';
    params.push(entityType);
  }

  if (action) {
    whereClause += ' AND action = ?';
    params.push(action);
  }

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count || 0;

  const logsResult = await db
    .prepare(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<AuditLog & { changes: string }>();

  const logs: AuditLog[] = (logsResult.results || []).map((row) => ({
    ...row,
    changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
  }));

  return { logs, total };
}

export async function getAuditLogsByEntity(
  db: D1Database,
  entityType: EntityType,
  entityId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ logs: AuditLog[]; total: number }> {
  const { limit = 50, offset = 0 } = options;

  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as count FROM audit_logs WHERE entity_type = ? AND entity_id = ?`
    )
    .bind(entityType, entityId)
    .first<{ count: number }>();

  const total = countResult?.count || 0;

  const logsResult = await db
    .prepare(
      `SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(entityType, entityId, limit, offset)
    .all<AuditLog & { changes: string }>();

  const logs: AuditLog[] = (logsResult.results || []).map((row) => ({
    ...row,
    changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
  }));

  return { logs, total };
}
