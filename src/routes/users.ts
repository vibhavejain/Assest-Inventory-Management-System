// ============================================================================
// Users API Routes
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
} from '../utils/response';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUUID,
  asCreateUserRequest,
  asUpdateUserRequest,
} from '../utils/validation';
import {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
} from '../db/users';
import { companyExists } from '../db/companies';

export async function handleUsersRoutes(
  request: Request,
  url: URL,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /users - Create user
  // GET /users - List users
  if (pathParts.length === 1 && pathParts[0] === 'users') {
    if (method === 'GET') {
      return handleListUsers(url, env);
    }
    if (method === 'POST') {
      return handleCreateUser(request, env, ctx);
    }
    return methodNotAllowedResponse(['GET', 'POST']);
  }

  // PATCH /users/:id - Update user
  if (pathParts.length === 2 && pathParts[0] === 'users') {
    const userId = pathParts[1];

    if (method === 'PATCH') {
      return handleUpdateUser(userId, request, env, ctx);
    }
    return methodNotAllowedResponse(['PATCH']);
  }

  return notFoundResponse('Route');
}

async function handleListUsers(url: URL, env: Env): Promise<Response> {
  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status') || undefined;
    const company_id = url.searchParams.get('company_id') || undefined;

    const { users, total } = await getAllUsers(env.DB, { limit, offset, status, company_id });

    return jsonResponse(users, 200, { total, limit, page: Math.floor(offset / limit) + 1 });
  } catch (error) {
    console.error('Error listing users:', error);
    return internalErrorResponse('Failed to list users');
  }
}

async function handleCreateUser(
  request: Request,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON body');
    }

    const validation = validateCreateUser(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asCreateUserRequest(body);

    const existingEmail = await getUserByEmail(env.DB, data.email);
    if (existingEmail) {
      return badRequestResponse('A user with this email already exists');
    }

    if (data.primary_company_id) {
      const companyExistsResult = await companyExists(env.DB, data.primary_company_id);
      if (!companyExistsResult) {
        return badRequestResponse('Primary company does not exist');
      }
    }

    const user = await createUser(env.DB, data, ctx.userId);

    return createdResponse(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return internalErrorResponse('Failed to create user');
  }
}

async function handleUpdateUser(
  userId: string,
  request: Request,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    const idValidation = validateUUID(userId, 'id');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON body');
    }

    const validation = validateUpdateUser(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asUpdateUserRequest(body);

    if (data.email) {
      const existingEmail = await getUserByEmail(env.DB, data.email);
      if (existingEmail && existingEmail.id !== userId) {
        return badRequestResponse('A user with this email already exists');
      }
    }

    if (data.primary_company_id) {
      const companyExistsResult = await companyExists(env.DB, data.primary_company_id);
      if (!companyExistsResult) {
        return badRequestResponse('Primary company does not exist');
      }
    }

    const user = await updateUser(env.DB, userId, data, ctx.userId);
    if (!user) {
      return notFoundResponse('User');
    }

    return jsonResponse(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return internalErrorResponse('Failed to update user');
  }
}
