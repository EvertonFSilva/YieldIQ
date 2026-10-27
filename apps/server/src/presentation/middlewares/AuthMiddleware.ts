import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../domain/errors/AppError';
import { supabaseClient } from '../../infrastructure/database/SupabaseClient';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';

export interface AuthenticatedUserPayload {
  id: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export async function authenticateRequest(
  request: Request,
  response: Response,
  nextFunction: NextFunction
): Promise<void> {
  const authorizationHeader = request.header('Authorization') || '';
  const apiTokenHeader = request.header('X-API-TOKEN');
  const apiTokenQuery = request.query.token as string | undefined;
  const providedApiToken = apiTokenHeader || apiTokenQuery;

  if (providedApiToken) {
    try {
      const userLookupResult = await postgresDatabase.query(
        'SELECT id, email, role FROM public.users WHERE api_key = $1 LIMIT 1',
        [providedApiToken]
      );

      if (userLookupResult.rows.length > 0) {
        const userRecord = userLookupResult.rows[0];
        request.user = {
          id: userRecord.id,
          email: userRecord.email,
          role: userRecord.role
        };

        const targetEndpoint = request.baseUrl + request.path;
        postgresDatabase
          .query(
            `INSERT INTO public.request_logs (user_id, endpoint, method, status_code, duration_ms, created_at)
             VALUES ($1, $2, $3, 200, 1, NOW())`,
            [userRecord.id, targetEndpoint, request.method]
          )
          .catch(() => {});

        return nextFunction();
      }
    } catch {
    }
  }

  if (authorizationHeader.startsWith('Bearer ')) {
    const bearerToken = authorizationHeader.substring(7).trim();
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(bearerToken);
      if (!userError && userData?.user) {
        const userLookupResult = await postgresDatabase.query(
          'SELECT id, email, role FROM public.users WHERE id = $1 LIMIT 1',
          [userData.user.id]
        );

        if (userLookupResult.rows.length > 0) {
          const userRecord = userLookupResult.rows[0];
          request.user = {
            id: userRecord.id,
            email: userRecord.email,
            role: userRecord.role
          };
          return nextFunction();
        }
      }
    } catch {
    }
  }

  return nextFunction(
    new UnauthorizedError('Unauthorized access. Provide a valid Bearer token or X-API-TOKEN header.')
  );
}

export async function optionalAuthenticateRequest(
  request: Request,
  response: Response,
  nextFunction: NextFunction
): Promise<void> {
  const authorizationHeader = request.header('Authorization') || '';
  const apiTokenHeader = request.header('X-API-TOKEN');
  const apiTokenQuery = request.query.token as string | undefined;
  const providedApiToken = apiTokenHeader || apiTokenQuery;

  if (providedApiToken) {
    try {
      const userLookupResult = await postgresDatabase.query(
        'SELECT id, email, role FROM public.users WHERE api_key = $1 LIMIT 1',
        [providedApiToken]
      );

      if (userLookupResult.rows.length > 0) {
        const userRecord = userLookupResult.rows[0];
        request.user = {
          id: userRecord.id,
          email: userRecord.email,
          role: userRecord.role
        };
      }
    } catch {
    }
  }

  if (authorizationHeader.startsWith('Bearer ')) {
    const bearerToken = authorizationHeader.substring(7).trim();
    try {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(bearerToken);
      if (!userError && userData?.user) {
        const userLookupResult = await postgresDatabase.query(
          'SELECT id, email, role FROM public.users WHERE id = $1 LIMIT 1',
          [userData.user.id]
        );

        if (userLookupResult.rows.length > 0) {
          const userRecord = userLookupResult.rows[0];
          request.user = {
            id: userRecord.id,
            email: userRecord.email,
            role: userRecord.role
          };
        }
      }
    } catch {
    }
  }

  return nextFunction();
}
