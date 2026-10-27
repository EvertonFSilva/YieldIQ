import crypto from 'crypto';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { NotFoundError } from '../../domain/errors/AppError';

export interface UserProfileResult {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  apiKey: string;
  phoneNumber: string | null;
  isWhatsAppEnabled: boolean;
  privilege: string;
  ruleLimit: number;
}

export class RetrieveUserProfileUseCase {
  public async execute(userId: string): Promise<UserProfileResult> {
    const { data: userProfileRecord, error: retrievalError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, created_at, api_key, phone, is_whatsapp_enabled, privilege, rule_limit')
      .eq('id', userId)
      .maybeSingle();

    if (retrievalError || !userProfileRecord) {
      throw new NotFoundError('User profile was not found');
    }

    let activeApiKey = userProfileRecord.api_key;
    if (!activeApiKey) {
      activeApiKey = 'yieldiq_' + crypto.randomBytes(24).toString('hex');
      await supabaseAdmin
        .from('users')
        .update({ api_key: activeApiKey })
        .eq('id', userId);
    }

    return {
      id: userProfileRecord.id,
      username: userProfileRecord.username,
      email: userProfileRecord.email,
      createdAt: userProfileRecord.created_at,
      apiKey: activeApiKey,
      phoneNumber: userProfileRecord.phone || null,
      isWhatsAppEnabled: Boolean(userProfileRecord.is_whatsapp_enabled),
      privilege: userProfileRecord.privilege || 'user',
      ruleLimit: userProfileRecord.rule_limit ?? 20
    };
  }
}
