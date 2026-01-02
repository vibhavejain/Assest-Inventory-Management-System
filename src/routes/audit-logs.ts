// ============================================================================
// Audit Logs API Routes
// ============================================================================

import type { Env, RequestContext } from '../types';
import {
  jsonResponse,
  validationErrorResponse,
  badRequestResponse,
  methodNotAllowedResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../utils/response';
import { validateUUID } from '../utils/validation';
import { getAuditLogsByCompany } from '../db/audit';
import { companyExists } from '../db/companies';

export async function handleAuditLogsRoutes(
  request: Request,
  url: URL,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // GET /audit-logs?company_id= - List audit logs by company
  if (pathParts.length === 1 && pathParts[0] === 'audit-logs') {
    if (method === 'GET') {
      return handleListAuditLogs(url, env);
    }
    return methodNotAllowedResponse(['GET']);
  }

  return notFoundResponse('Route');
}

async function handleListAuditLogs(url: URL, env: Env): Promise<Response> {
  try {
    const companyId = url.searchParams.get('company_id');

    if (!companyId) {
      return badRequestResponse('company_id query parameter is required');
    }

    const idValidation = validateUUID(companyId, 'company_id');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    const companyExistsResult = await companyExists(env.DB, companyId);
    if (!companyExistsResult) {
      return notFoundResponse('Company');
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const entityType = url.searchParams.get('entity_type') as any || undefined;
    const action = url.searchParams.get('action') as any || undefined;

    const { logs, total } = await getAuditLogsByCompany(env.DB, companyId, {
      limit,
      offset,
      entityType,
      action,
    });

    return jsonResponse(logs, 200, { total, limit, page: Math.floor(offset / limit) + 1 });
  } catch (error) {
    console.error('Error listing audit logs:', error);
    return internalErrorResponse('Failed to list audit logs');
  }
}
