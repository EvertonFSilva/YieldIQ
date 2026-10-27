import crypto from 'crypto';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';

export class RegenerateApiKeyUseCase {
  public async execute(userId: string): Promise<string> {
    const newlyGeneratedApiKey = 'yieldiq_' + crypto.randomBytes(24).toString('hex');

    await postgresDatabase.query(
      'UPDATE public.users SET api_key = $1, updated_at = NOW() WHERE id = $2',
      [newlyGeneratedApiKey, userId]
    );

    return newlyGeneratedApiKey;
  }
}
