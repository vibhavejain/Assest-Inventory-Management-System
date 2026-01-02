// ============================================================================
// Asset Inventory Management System - Main Worker Entry Point
// ============================================================================

import type { Env, RequestContext } from './types';
import {
  handleCompaniesRoutes,
  handleUsersRoutes,
  handleCompanyAccessRoutes,
  handleAssetsRoutes,
  handleAuditLogsRoutes,
} from './routes';
import {
  jsonResponse,
  notFoundResponse,
  internalErrorResponse,
  methodNotAllowedResponse,
} from './utils/response';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return handleCors();
    }

    // Build request context (for future auth integration)
    const requestContext = buildRequestContext(request);

    try {
      // Health check endpoint
      if (pathname === '/health') {
        return addCorsHeaders(
          jsonResponse({ status: 'ok', timestamp: new Date().toISOString() })
        );
      }

      // API info endpoint
      if (pathname === '/' || pathname === '') {
        return addCorsHeaders(
          jsonResponse({
            name: 'Asset Inventory Management System API',
            version: '1.0.0',
            status: 'operational',
            endpoints: {
              companies: '/companies',
              users: '/users',
              assets: '/assets',
              audit_logs: '/audit-logs',
            },
          })
        );
      }

      // Route to appropriate handler
      let response: Response;

      if (pathname.startsWith('/companies')) {
        // Check if this is a company access route
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length >= 3 && pathParts[2] === 'users') {
          response = await handleCompanyAccessRoutes(request, url, env, requestContext);
        } else {
          response = await handleCompaniesRoutes(request, url, env, requestContext);
        }
      } else if (pathname.startsWith('/users')) {
        response = await handleUsersRoutes(request, url, env, requestContext);
      } else if (pathname.startsWith('/assets')) {
        response = await handleAssetsRoutes(request, url, env, requestContext);
      } else if (pathname.startsWith('/audit-logs')) {
        response = await handleAuditLogsRoutes(request, url, env, requestContext);
      } else {
        response = notFoundResponse('Route');
      }

      return addCorsHeaders(response);
    } catch (error) {
      console.error('Unhandled error:', error);
      return addCorsHeaders(internalErrorResponse('An unexpected error occurred'));
    }
  },
};

function buildRequestContext(request: Request): RequestContext {
  // Extract user context from headers (for future auth integration)
  // These headers would be set by an auth middleware/gateway
  const userId = request.headers.get('X-User-Id') || undefined;
  const companyId = request.headers.get('X-Company-Id') || undefined;

  return {
    userId,
    companyId,
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

function handleCors(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Company-Id, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-Company-Id, Authorization');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
