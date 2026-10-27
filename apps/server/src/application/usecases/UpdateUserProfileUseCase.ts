import { supabaseAdmin, supabaseClient } from '../../infrastructure/database/SupabaseClient';
import { ValidationError, ConflictError, UnauthorizedError, ExternalServiceError, NotFoundError } from '../../domain/errors/AppError';

export class UpdateUserProfileUseCase {
  public async updateUsername(userId: string, newUsername: string): Promise<string> {
    const trimmedUsername = newUsername?.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      throw new ValidationError('Username must contain at least 3 characters');
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('username', trimmedUsername)
      .neq('id', userId)
      .maybeSingle();

    if (existingUser) {
      throw new ConflictError('Username is already taken by another account');
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ username: trimmedUsername })
      .eq('id', userId);

    if (updateError) {
      throw new ExternalServiceError('Failed to update username');
    }

    return trimmedUsername;
  }

  public async updatePhoneNumber(userId: string, phoneNumber: string): Promise<string> {
    const sanitizedPhoneNumber = (phoneNumber || '').replace(/\D/g, '');

    if (sanitizedPhoneNumber && (sanitizedPhoneNumber.length < 10 || sanitizedPhoneNumber.length > 13)) {
      throw new ValidationError('Invalid phone number format provided');
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ phone: sanitizedPhoneNumber || null })
      .eq('id', userId);

    if (updateError) {
      throw new ExternalServiceError('Failed to update phone number');
    }

    return sanitizedPhoneNumber;
  }

  public async updateWhatsAppPreference(userId: string, isEnabled: boolean): Promise<boolean> {
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_whatsapp_enabled: Boolean(isEnabled) })
      .eq('id', userId);

    if (updateError) {
      throw new ExternalServiceError('Failed to update WhatsApp notification preference');
    }

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

    const { data: userProfileRecord } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (!userProfileRecord || !userProfileRecord.email) {
      throw new NotFoundError('User email could not be located');
    }

    const { data: authenticationData, error: authenticationError } =
      await supabaseClient.auth.signInWithPassword({
        email: userProfileRecord.email,
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
