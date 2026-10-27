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
  role: string;
  privilege: string;
  alertQuota: number;
  ruleLimit: number;
}

export class RetrieveUserProfileUseCase {
  public async execute(userId: string): Promise<UserProfileResult> {
    const { data: userProfileRecord, error: retrievalError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, created_at, api_key, phone_number, is_whatsapp_enabled, role, alert_quota')
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

    const assignedRole = userProfileRecord.role || 'USER';
    const quota = userProfileRecord.alert_quota ?? 20;

    return {
      id: userProfileRecord.id,
      username: userProfileRecord.username,
      email: userProfileRecord.email,
      createdAt: userProfileRecord.created_at,
      apiKey: activeApiKey,
      phoneNumber: userProfileRecord.phone_number || null,
      isWhatsAppEnabled: Boolean(userProfileRecord.is_whatsapp_enabled),
      role: assignedRole,
      privilege: assignedRole.toLowerCase(),
      alertQuota: quota,
      ruleLimit: quota
    };
  }
}
