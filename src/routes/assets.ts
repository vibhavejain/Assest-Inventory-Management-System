// ============================================================================
// Assets API Routes
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
  validateCreateAsset,
  validateUpdateAsset,
  validateUUID,
  asCreateAssetRequest,
  asUpdateAssetRequest,
} from '../utils/validation';
import {
  createAsset,
  getAssetById,
  getAllAssets,
  updateAsset,
} from '../db/assets';
import { companyExists } from '../db/companies';

export async function handleAssetsRoutes(
  request: Request,
  url: URL,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /assets - Create asset
  // GET /assets - List assets
  if (pathParts.length === 1 && pathParts[0] === 'assets') {
    if (method === 'GET') {
      return handleListAssets(url, env);
    }
    if (method === 'POST') {
      return handleCreateAsset(request, env, ctx);
    }
    return methodNotAllowedResponse(['GET', 'POST']);
  }

  // PATCH /assets/:id - Update asset
  if (pathParts.length === 2 && pathParts[0] === 'assets') {
    const assetId = pathParts[1];

    if (method === 'PATCH') {
      return handleUpdateAsset(assetId, request, env, ctx);
    }
    return methodNotAllowedResponse(['PATCH']);
  }

  return notFoundResponse('Route');
}

async function handleListAssets(url: URL, env: Env): Promise<Response> {
  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const company_id = url.searchParams.get('company_id') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const { assets, total } = await getAllAssets(env.DB, {
      limit,
      offset,
      company_id,
      type,
      status,
    });

    return jsonResponse(assets, 200, { total, limit, page: Math.floor(offset / limit) + 1 });
  } catch (error) {
    console.error('Error listing assets:', error);
    return internalErrorResponse('Failed to list assets');
  }
}

async function handleCreateAsset(
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

    const validation = validateCreateAsset(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asCreateAssetRequest(body);

    const companyExistsResult = await companyExists(env.DB, data.company_id);
    if (!companyExistsResult) {
      return badRequestResponse('Company does not exist');
    }

    const asset = await createAsset(env.DB, data, ctx.userId);

    return createdResponse(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return internalErrorResponse('Failed to create asset');
  }
}

async function handleUpdateAsset(
  assetId: string,
  request: Request,
  env: Env,
  ctx: RequestContext
): Promise<Response> {
  try {
    const idValidation = validateUUID(assetId, 'id');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON body');
    }

    const validation = validateUpdateAsset(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const data = asUpdateAssetRequest(body);

    const asset = await updateAsset(env.DB, assetId, data, ctx.userId);
    if (!asset) {
      return notFoundResponse('Asset');
    }

    return jsonResponse(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return internalErrorResponse('Failed to update asset');
  }
}
