import crypto from 'crypto';
import { supabaseClient } from '../../infrastructure/database/SupabaseClient';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
import { ValidationError, ConflictError, ExternalServiceError } from '../../domain/errors/AppError';

export interface RegisterUserCommand {
  username: string;
  email: string;
  password: string;
}

export interface RegisterUserResult {
  id: string;
  username: string;
  email: string;
  apiKey: string;
}

export class RegisterUserUseCase {
  public async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const trimmedUsername = command.username?.trim();
    const trimmedEmail = command.email?.trim().toLowerCase();
    const providedPassword = command.password;

    if (!trimmedUsername || !trimmedEmail || !providedPassword) {
      throw new ValidationError('Username, email, and password are required fields');
    }

    if (trimmedUsername.length < 3) {
      throw new ValidationError('Username must contain at least 3 characters');
    }

    if (providedPassword.length < 6) {
      throw new ValidationError('Password must contain at least 6 characters');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      throw new ValidationError('Provided email format is invalid');
    }

    const existingUsernameResult = await postgresDatabase.query(
      'SELECT id FROM public.users WHERE username ILIKE $1 LIMIT 1',
      [trimmedUsername]
    );

    if (existingUsernameResult.rows.length > 0) {
      throw new ConflictError('Username is already taken');
    }

    const existingEmailResult = await postgresDatabase.query(
      'SELECT id FROM public.users WHERE email ILIKE $1 LIMIT 1',
      [trimmedEmail]
    );

    if (existingEmailResult.rows.length > 0) {
      throw new ConflictError('Email is already registered');
    }

    const { data: authenticationResult, error: authenticationError } =
      await supabaseClient.auth.signUp({
        email: trimmedEmail,
        password: providedPassword,
        options: {
          data: {
            username: trimmedUsername,
            role: 'USER'
          }
        }
      });

    if (authenticationError || !authenticationResult.user) {
      throw new ExternalServiceError(
        authenticationError?.message || 'Failed to create user authentication identity'
      );
    }

    const userId = authenticationResult.user.id;
    await postgresDatabase.query(
      'UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1',
      [userId]
    );

    const generatedApiKey = 'yieldiq_' + crypto.randomBytes(24).toString('hex');

    await postgresDatabase.query(
      `INSERT INTO public.users (id, username, email, api_key, role, alert_quota, is_whatsapp_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'USER', 20, true, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         api_key = EXCLUDED.api_key`,
      [userId, trimmedUsername, trimmedEmail, generatedApiKey]
    );

    return {
      id: userId,
      username: trimmedUsername,
      email: trimmedEmail,
      apiKey: generatedApiKey
    };
  }
}
