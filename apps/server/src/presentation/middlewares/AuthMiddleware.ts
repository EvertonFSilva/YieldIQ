import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../domain/errors/AppError';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { environment } from '../../config/env';

export interface AuthenticatedUserPayload {
  id: string;
  email?: string;
  privilege?: string;
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
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('id, email, privilege')
        .eq('api_key', providedApiToken)
        .maybeSingle();

      if (userRecord) {
        request.user = {
          id: userRecord.id,
          email: userRecord.email,
          privilege: userRecord.privilege
        };

        const targetEndpoint = request.baseUrl + request.path;
        supabaseAdmin
          .from('api_telemetry')
          .insert({
            user_id: userRecord.id,
            endpoint: targetEndpoint,
            method: request.method,
            created_at: new Date().toISOString()
          })
          .then(undefined, () => {});

        return nextFunction();
      }
    } catch {
    }
  }

  if (authorizationHeader.startsWith('Bearer ')) {
    const bearerToken = authorizationHeader.substring(7);
    try {
      const decodedPayload = jwt.verify(bearerToken, environment.JWT_SECRET) as any;
      if (decodedPayload && decodedPayload.sub) {
        request.user = {
          id: decodedPayload.sub,
          email: decodedPayload.email,
          privilege: decodedPayload.user_metadata?.privilege
        };
        return nextFunction();
      }
    } catch {
    }
  }

  return nextFunction(
    new UnauthorizedError('Unauthorized access. Provide a valid Bearer token or X-API-TOKEN header.')
  );
}
