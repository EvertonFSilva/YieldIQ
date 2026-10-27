import crypto from 'crypto';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { ExternalServiceError } from '../../domain/errors/AppError';

export class RegenerateApiKeyUseCase {
  public async execute(userId: string): Promise<string> {
    const newlyGeneratedApiKey = 'yieldiq_' + crypto.randomBytes(24).toString('hex');

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ api_key: newlyGeneratedApiKey })
      .eq('id', userId);

    if (updateError) {
      throw new ExternalServiceError('Failed to regenerate user API key');
    }

    return newlyGeneratedApiKey;
  }
}
