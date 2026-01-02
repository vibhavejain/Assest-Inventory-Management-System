// ============================================================================
// Users Database Operations
// ============================================================================

import type { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { createAuditLog } from './audit';

export async function createUser(
  db: D1Database,
  data: CreateUserRequest,
  actingUserId?: string
): Promise<User> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const status = data.status || 'active';

  await db
    .prepare(
      `INSERT INTO users (id, email, name, primary_company_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.email.toLowerCase().trim(),
      data.name.trim(),
      data.primary_company_id || null,
      status,
      createdAt
    )
    .run();

  const user: User = {
    id,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    primary_company_id: data.primary_company_id || null,
    status,
    created_at: createdAt,
  };

  const companyId = data.primary_company_id || id;
  await createAuditLog(db, {
    companyId,
    userId: actingUserId,
    entityType: 'user',
    entityId: id,
    action: 'create',
    changes: { created: user },
  });

  return user;
}

export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const result = await db
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first<User>();

  return result || null;
}

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email.toLowerCase().trim())
    .first<User>();

  return result || null;
}

export async function getAllUsers(
  db: D1Database,
  options: { limit?: number; offset?: number; status?: string; company_id?: string } = {}
): Promise<{ users: User[]; total: number }> {
  const { limit = 50, offset = 0, status, company_id } = options;

  let whereClause = '';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
  }

  if (company_id) {
    conditions.push(
      '(u.primary_company_id = ? OR EXISTS (SELECT 1 FROM company_access ca WHERE ca.user_id = u.id AND ca.company_id = ?))'
    );
    params.push(company_id, company_id);
  }

  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  const countResult = await db
    .prepare(`SELECT COUNT(DISTINCT u.id) as count FROM users u ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count || 0;

  const usersResult = await db
    .prepare(
      `SELECT DISTINCT u.* FROM users u ${whereClause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<User>();

  return {
    users: usersResult.results || [],
    total,
  };
}

export async function updateUser(
  db: D1Database,
  id: string,
  data: UpdateUserRequest,
  actingUserId?: string
): Promise<User | null> {
  const existing = await getUserById(db, id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | null)[] = [];
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email.toLowerCase().trim());
    changes.email = { from: existing.email, to: data.email.toLowerCase().trim() };
  }

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name.trim());
    changes.name = { from: existing.name, to: data.name.trim() };
  }

  if (data.primary_company_id !== undefined) {
    updates.push('primary_company_id = ?');
    values.push(data.primary_company_id);
    changes.primary_company_id = { from: existing.primary_company_id, to: data.primary_company_id };
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
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getUserById(db, id);

  if (updated) {
    const companyId = updated.primary_company_id || id;
    await createAuditLog(db, {
      companyId,
      userId: actingUserId,
      entityType: 'user',
      entityId: id,
      action: 'update',
      changes,
    });
  }

  return updated;
}

export async function userExists(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`SELECT 1 FROM users WHERE id = ?`)
    .bind(id)
    .first();

  return result !== null;
}
