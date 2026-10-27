import { supabaseClient } from '../../infrastructure/database/SupabaseClient';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
import { ValidationError, UnauthorizedError } from '../../domain/errors/AppError';

export interface AuthenticateUserCommand {
  identifier: string;
  password: string;
}

export interface AuthenticateUserResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  username: string;
  apiKey: string | null;
  role: string;
  privilege: string;
}

export class AuthenticateUserUseCase {
  public async execute(command: AuthenticateUserCommand): Promise<AuthenticateUserResult> {
    const trimmedIdentifier = command.identifier?.trim();
    const providedPassword = command.password;

    if (!trimmedIdentifier || !providedPassword) {
      throw new ValidationError('Identifier and password are required fields');
    }

    let resolvedEmail = trimmedIdentifier;

    if (!resolvedEmail.includes('@')) {
      const userLookupResult = await postgresDatabase.query(
        'SELECT email FROM public.users WHERE username ILIKE $1 LIMIT 1',
        [trimmedIdentifier]
      );

      if (userLookupResult.rows.length === 0 || !userLookupResult.rows[0].email) {
        throw new UnauthorizedError('Invalid user credentials provided');
      }

      resolvedEmail = userLookupResult.rows[0].email;
    }

    const { data: authenticationData, error: authenticationError } =
      await supabaseClient.auth.signInWithPassword({
        email: resolvedEmail,
        password: providedPassword
      });

    if (authenticationError || !authenticationData.session || !authenticationData.user) {
      throw new UnauthorizedError('Invalid user credentials provided');
    }

    const profileResult = await postgresDatabase.query(
      'SELECT api_key, username, role FROM public.users WHERE id = $1 LIMIT 1',
      [authenticationData.user.id]
    );

    const userProfileRecord = profileResult.rows[0];
    const assignedRole = userProfileRecord?.role || 'USER';

    return {
      accessToken: authenticationData.session.access_token,
      refreshToken: authenticationData.session.refresh_token,
      userId: authenticationData.user.id,
      username: userProfileRecord?.username || resolvedEmail,
      apiKey: userProfileRecord?.api_key || null,
      role: assignedRole,
      privilege: assignedRole.toLowerCase()
    };
  }
}
