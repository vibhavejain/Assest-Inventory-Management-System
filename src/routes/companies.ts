// ============================================================================
// Companies API Routes
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
  validateCreateCompany,
  validateUpdateCompany,
  validateUUID,
  asCreateCompanyRequest,
  asUpdateCompanyRequest,
} from '../utils/validation';
import {
  createCompany,
  getCompanyById,
  getCompanyByName,
  getAllCompanies,
  updateCompany,
  deleteCompany,
} from '../db/companies';

export async function handleCompaniesRoutes(
  request: Request,
  url: URL,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /companies - Create company
  // GET /companies - List companies
  if (pathParts.length === 1 && pathParts[0] === 'companies') {
    if (method === 'GET') {
      return handleListCompanies(url, env);
    }
    if (method === 'POST') {
      return handleCreateCompany(request, env, ctx);
    }
    return methodNotAllowedResponse(['GET', 'POST']);
  }

  // GET /companies/:id - Get company by ID
  // PATCH /companies/:id - Update company
  // DELETE /companies/:id - Delete company
  if (pathParts.length === 2 && pathParts[0] === 'companies') {
    const companyId = pathParts[1];

    if (method === 'GET') {
      return handleGetCompany(companyId, env);
    }
    if (method === 'PATCH') {
      return handleUpdateCompany(companyId, request, env, ctx);
    }
    if (method === 'DELETE') {
      return handleDeleteCompany(companyId, env, ctx);
    }
    return methodNotAllowedResponse(['GET', 'PATCH', 'DELETE']);
  }

  return notFoundResponse('Route');
}

async function handleListCompanies(url: URL, env: Env): Promise<Response> {
  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status') || undefined;

    const { companies, total } = await getAllCompanies(env.DB, { limit, offset, status });

    return jsonResponse(companies, 200, { total, limit, page: Math.floor(offset / limit) + 1 });
  } catch (error) {
    console.error('Error listing companies:', error);
    return internalErrorResponse('Failed to list companies');
  }
}

async function handleCreateCompany(
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

    const validation = validateCreateCompany(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asCreateCompanyRequest(body);

    const existing = await getCompanyByName(env.DB, data.name);
    if (existing) {
      return badRequestResponse('A company with this name already exists');
    }

    const company = await createCompany(env.DB, data, ctx.userId);

    return createdResponse(company);
  } catch (error) {
    console.error('Error creating company:', error);
    return internalErrorResponse('Failed to create company');
  }
}

async function handleGetCompany(companyId: string, env: Env): Promise<Response> {
  try {
    const validation = validateUUID(companyId, 'id');
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const company = await getCompanyById(env.DB, companyId);
    if (!company) {
      return notFoundResponse('Company');
    }

    return jsonResponse(company);
  } catch (error) {
    console.error('Error getting company:', error);
    return internalErrorResponse('Failed to get company');
  }
}

async function handleDeleteCompany(
  companyId: string,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    const idValidation = validateUUID(companyId, 'id');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    const result = await deleteCompany(env.DB, companyId, ctx.userId);
    if (!result.success) {
      if (result.error === 'Company not found') {
        return notFoundResponse('Company');
      }
      return badRequestResponse(result.error || 'Failed to delete company');
    }

    return jsonResponse({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return internalErrorResponse('Failed to delete company');
  }
}

async function handleUpdateCompany(
  companyId: string,
  request: Request,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    const idValidation = validateUUID(companyId, 'id');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON body');
    }

    const validation = validateUpdateCompany(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asUpdateCompanyRequest(body);

    if (data.name) {
      const existing = await getCompanyByName(env.DB, data.name);
      if (existing && existing.id !== companyId) {
        return badRequestResponse('A company with this name already exists');
      }
    }

    const company = await updateCompany(env.DB, companyId, data, ctx.userId);
    if (!company) {
      return notFoundResponse('Company');
    }

    return jsonResponse(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return internalErrorResponse('Failed to update company');
  }
}
