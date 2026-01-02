// ============================================================================
// Company Access API Routes
// ============================================================================

import type { Env, RequestContext } from '../types';
import {
  jsonResponse,
  createdResponse,
  notFoundResponse,
  validationErrorResponse,
  badRequestResponse,
  methodNotAllowedResponse,
  internalErrorResponse,
  noContentResponse,
} from '../utils/response';
import {
  validateAddUserToCompany,
  validateUUID,
  asAddUserToCompanyRequest,
} from '../utils/validation';
import {
  addUserToCompany,
  removeUserFromCompany,
  companyAccessExists,
  getCompanyUsers,
} from '../db/company-access';
import { companyExists } from '../db/companies';
import { userExists } from '../db/users';

export async function handleCompanyAccessRoutes(
  request: Request,
  url: URL,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /companies/:id/users - Add user to company
  // GET /companies/:id/users - List company users (bonus endpoint)
  if (
    pathParts.length === 3 &&
    pathParts[0] === 'companies' &&
    pathParts[2] === 'users'
  ) {
    const companyId = pathParts[1];

    if (method === 'GET') {
      return handleListCompanyUsers(companyId, url, env);
    }
    if (method === 'POST') {
      return handleAddUserToCompany(companyId, request, env, ctx);
    }
    return methodNotAllowedResponse(['GET', 'POST']);
  }

  // DELETE /companies/:id/users/:userId - Remove user from company
  if (
    pathParts.length === 4 &&
    pathParts[0] === 'companies' &&
    pathParts[2] === 'users'
  ) {
    const companyId = pathParts[1];
    const userId = pathParts[3];

    if (method === 'DELETE') {
      return handleRemoveUserFromCompany(companyId, userId, env, ctx);
    }
    return methodNotAllowedResponse(['DELETE']);
  }

  return notFoundResponse('Route');
}

async function handleListCompanyUsers(
  companyId: string,
  url: URL,
  env: Env
): Promise<Response> {
  try {
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

    const { access, total } = await getCompanyUsers(env.DB, companyId, { limit, offset });

    return jsonResponse(access, 200, { total, limit, page: Math.floor(offset / limit) + 1 });
  } catch (error) {
    console.error('Error listing company users:', error);
    return internalErrorResponse('Failed to list company users');
  }
}

async function handleAddUserToCompany(
  companyId: string,
  request: Request,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    const idValidation = validateUUID(companyId, 'company_id');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON body');
    }

    const validation = validateAddUserToCompany(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asAddUserToCompanyRequest(body);

    const companyExistsResult = await companyExists(env.DB, companyId);
    if (!companyExistsResult) {
      return notFoundResponse('Company');
    }

    const userExistsResult = await userExists(env.DB, data.user_id);
    if (!userExistsResult) {
      return badRequestResponse('User does not exist');
    }

    const accessExists = await companyAccessExists(env.DB, companyId, data.user_id);
    if (accessExists) {
      return badRequestResponse('User already has access to this company');
    }

    const access = await addUserToCompany(env.DB, companyId, data, ctx.userId);

    return createdResponse(access);
  } catch (error) {
    console.error('Error adding user to company:', error);
    return internalErrorResponse('Failed to add user to company');
  }
}

async function handleRemoveUserFromCompany(
  companyId: string,
  userId: string,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    const companyIdValidation = validateUUID(companyId, 'company_id');
    if (!companyIdValidation.valid) {
      return validationErrorResponse(companyIdValidation.errors);
    }

    const userIdValidation = validateUUID(userId, 'user_id');
    if (!userIdValidation.valid) {
      return validationErrorResponse(userIdValidation.errors);
    }

    const companyExistsResult = await companyExists(env.DB, companyId);
    if (!companyExistsResult) {
      return notFoundResponse('Company');
    }

    const removed = await removeUserFromCompany(env.DB, companyId, userId, ctx.userId);
    if (!removed) {
      return notFoundResponse('Company access');
    }

    return noContentResponse();
  } catch (error) {
    console.error('Error removing user from company:', error);
    return internalErrorResponse('Failed to remove user from company');
  }
}
