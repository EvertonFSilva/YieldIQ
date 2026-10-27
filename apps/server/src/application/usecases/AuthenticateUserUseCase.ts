import { supabaseClient, supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
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
      const { data: userLookupRecord } = await supabaseAdmin
        .from('users')
        .select('email')
        .ilike('username', trimmedIdentifier)
        .maybeSingle();

      if (!userLookupRecord || !userLookupRecord.email) {
        throw new UnauthorizedError('Invalid user credentials provided');
      }

      resolvedEmail = userLookupRecord.email;
    }

    const { data: authenticationData, error: authenticationError } =
      await supabaseClient.auth.signInWithPassword({
        email: resolvedEmail,
        password: providedPassword
      });

    if (authenticationError || !authenticationData.session || !authenticationData.user) {
      throw new UnauthorizedError('Invalid user credentials provided');
    }

    const { data: userProfileRecord } = await supabaseAdmin
      .from('users')
      .select('api_key, username, privilege')
      .eq('id', authenticationData.user.id)
      .maybeSingle();

    return {
      accessToken: authenticationData.session.access_token,
      refreshToken: authenticationData.session.refresh_token,
      userId: authenticationData.user.id,
      username: userProfileRecord?.username || resolvedEmail,
      apiKey: userProfileRecord?.api_key || null,
      privilege: userProfileRecord?.privilege || 'user'
    };
  }
}
