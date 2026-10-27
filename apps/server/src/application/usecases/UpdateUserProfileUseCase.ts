import { supabaseClient } from '../../infrastructure/database/SupabaseClient';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
import { ValidationError, ConflictError, UnauthorizedError, ExternalServiceError, NotFoundError } from '../../domain/errors/AppError';

export class UpdateUserProfileUseCase {
  public async updateUsername(userId: string, newUsername: string): Promise<string> {
    const trimmedUsername = newUsername?.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      throw new ValidationError('Username must contain at least 3 characters');
    }

    const existingUserResult = await postgresDatabase.query(
      'SELECT id FROM public.users WHERE username ILIKE $1 AND id <> $2 LIMIT 1',
      [trimmedUsername, userId]
    );

    if (existingUserResult.rows.length > 0) {
      throw new ConflictError('Username is already taken by another account');
    }

    await postgresDatabase.query(
      'UPDATE public.users SET username = $1, updated_at = NOW() WHERE id = $2',
      [trimmedUsername, userId]
    );

    return trimmedUsername;
  }

  public async updatePhoneNumber(userId: string, phoneNumber: string): Promise<string> {
    const sanitizedPhoneNumber = (phoneNumber || '').replace(/\D/g, '');

    if (sanitizedPhoneNumber && (sanitizedPhoneNumber.length < 10 || sanitizedPhoneNumber.length > 13)) {
      throw new ValidationError('Invalid phone number format provided');
    }

    await postgresDatabase.query(
      'UPDATE public.users SET phone_number = $1, updated_at = NOW() WHERE id = $2',
      [sanitizedPhoneNumber || null, userId]
    );

    return sanitizedPhoneNumber;
  }

  public async updateWhatsAppPreference(userId: string, isEnabled: boolean): Promise<boolean> {
    await postgresDatabase.query(
      'UPDATE public.users SET is_whatsapp_enabled = $1, updated_at = NOW() WHERE id = $2',
      [Boolean(isEnabled), userId]
    );

    return Boolean(isEnabled);
  }

  public async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Both current and new passwords are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must contain at least 6 characters');
    }

    const userProfileResult = await postgresDatabase.query(
      'SELECT email FROM public.users WHERE id = $1 LIMIT 1',
      [userId]
    );

    if (userProfileResult.rows.length === 0 || !userProfileResult.rows[0].email) {
      throw new NotFoundError('User email could not be located');
    }

    const { data: authenticationData, error: authenticationError } =
      await supabaseClient.auth.signInWithPassword({
        email: userProfileResult.rows[0].email,
        password: currentPassword
      });

    if (authenticationError || !authenticationData.session) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new ExternalServiceError('Failed to update password');
    }
  }
}
