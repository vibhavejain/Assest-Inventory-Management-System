// ============================================================================
// HTTP Response Utilities
// ============================================================================

import type { ApiResponse, ApiError, ResponseMeta } from '../types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
};

export function jsonResponse<T>(
  data: T,
  status: number = 200,
  meta?: ResponseMeta
): Response {
  const body: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    meta,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, string[]>
): Response {
  const error: ApiError = { code, message, details };
  const body: ApiResponse = {
    success: false,
    error,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export function notFoundResponse(resource: string = 'Resource'): Response {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

export function badRequestResponse(
  message: string,
  details?: Record<string, string[]>
): Response {
  return errorResponse('BAD_REQUEST', message, 400, details);
}

export function validationErrorResponse(
  errors: Record<string, string[]>
): Response {
  return errorResponse('VALIDATION_ERROR', 'Validation failed', 400, errors);
}

export function internalErrorResponse(message: string = 'Internal server error'): Response {
  return errorResponse('INTERNAL_ERROR', message, 500);
}

export function methodNotAllowedResponse(allowed: string[]): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method not allowed. Allowed: ${allowed.join(', ')}`,
      },
    }),
    {
      status: 405,
      headers: {
        ...JSON_HEADERS,
        Allow: allowed.join(', '),
      },
    }
  );
}

export function createdResponse<T>(data: T): Response {
  return jsonResponse(data, 201);
}

export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}
