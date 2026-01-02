// ============================================================================
// Assets Database Operations
// ============================================================================

import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '../types';
import { createAuditLog } from './audit';

export async function createAsset(
  db: D1Database,
  data: CreateAssetRequest,
  userId?: string
): Promise<Asset> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const status = data.status || 'active';
  const metadataJson = JSON.stringify(data.metadata || {});

  await db
    .prepare(
      `INSERT INTO assets (id, company_id, type, name, identifier, status, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.company_id,
      data.type,
      data.name.trim(),
      data.identifier || null,
      status,
      metadataJson,
      createdAt
    )
    .run();

  const asset: Asset = {
    id,
    company_id: data.company_id,
    type: data.type,
    name: data.name.trim(),
    identifier: data.identifier || null,
    status,
    metadata: data.metadata || {},
    created_at: createdAt,
  };

  await createAuditLog(db, {
    companyId: data.company_id,
    userId,
    entityType: 'asset',
    entityId: id,
    action: 'create',
    changes: { created: asset },
  });

  return asset;
}

export async function getAssetById(
  db: D1Database,
  id: string
): Promise<Asset | null> {
  const result = await db
    .prepare(`SELECT * FROM assets WHERE id = ?`)
    .bind(id)
    .first<Asset & { metadata: string }>();

  if (!result) {
    return null;
  }

  return {
    ...result,
    metadata: typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata,
  };
}

export async function getAllAssets(
  db: D1Database,
  options: {
    limit?: number;
    offset?: number;
    company_id?: string;
    type?: string;
    status?: string;
  } = {}
): Promise<{ assets: Asset[]; total: number }> {
  const { limit = 50, offset = 0, company_id, type, status } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (company_id) {
    conditions.push('company_id = ?');
    params.push(company_id);
  }

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM assets ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count || 0;

  const assetsResult = await db
    .prepare(
      `SELECT * FROM assets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<Asset & { metadata: string }>();

  const assets: Asset[] = (assetsResult.results || []).map((row) => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
  }));

  return { assets, total };
}

export async function updateAsset(
  db: D1Database,
  id: string,
  data: UpdateAssetRequest,
  userId?: string
): Promise<Asset | null> {
  const existing = await getAssetById(db, id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | null)[] = [];
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
    changes.type = { from: existing.type, to: data.type };
  }

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name.trim());
    changes.name = { from: existing.name, to: data.name.trim() };
  }

  if (data.identifier !== undefined) {
    updates.push('identifier = ?');
    values.push(data.identifier);
    changes.identifier = { from: existing.identifier, to: data.identifier };
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
    changes.status = { from: existing.status, to: data.status };
  }

  if (data.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(JSON.stringify(data.metadata));
    changes.metadata = { from: existing.metadata, to: data.metadata };
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);

  await db
    .prepare(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getAssetById(db, id);

  if (updated) {
    await createAuditLog(db, {
      companyId: existing.company_id,
      userId,
      entityType: 'asset',
      entityId: id,
      action: 'update',
      changes,
    });
  }

  return updated;
}

export async function assetExists(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`SELECT 1 FROM assets WHERE id = ?`)
    .bind(id)
    .first();

  return result !== null;
}
