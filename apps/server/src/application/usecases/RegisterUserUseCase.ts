import crypto from 'crypto';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
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

    const { data: existingUserRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('username', trimmedUsername)
      .maybeSingle();

    if (existingUserRecord) {
      throw new ConflictError('Username is already taken');
    }

    const { data: existingEmailRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', trimmedEmail)
      .maybeSingle();

    if (existingEmailRecord) {
      throw new ConflictError('Email is already registered');
    }

    const { data: authenticationResult, error: authenticationError } =
      await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password: providedPassword,
        email_confirm: true
      });

    if (authenticationError || !authenticationResult.user) {
      throw new ExternalServiceError(
        authenticationError?.message || 'Failed to create user authentication identity'
      );
    }

    const generatedApiKey = 'yieldiq_' + crypto.randomBytes(24).toString('hex');
    const creationTimestamp = new Date().toISOString();

    const { error: profileInsertionError } = await supabaseAdmin.from('users').insert({
      id: authenticationResult.user.id,
      username: trimmedUsername,
      email: trimmedEmail,
      api_key: generatedApiKey,
      created_at: creationTimestamp
    });

    if (profileInsertionError) {
      throw new ExternalServiceError('Failed to initialize user profile record');
    }

    return {
      id: authenticationResult.user.id,
      username: trimmedUsername,
      email: trimmedEmail,
      apiKey: generatedApiKey
    };
  }
}
