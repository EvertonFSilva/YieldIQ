import crypto from 'crypto';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
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
    const userResult = await postgresDatabase.query(
      `SELECT id, username, email, created_at, api_key, phone_number, is_whatsapp_enabled, role, alert_quota
       FROM public.users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User profile was not found');
    }

    const userProfileRecord = userResult.rows[0];
    let activeApiKey = userProfileRecord.api_key;
    if (!activeApiKey) {
      activeApiKey = 'yieldiq_' + crypto.randomBytes(24).toString('hex');
      await postgresDatabase.query(
        'UPDATE public.users SET api_key = $1, updated_at = NOW() WHERE id = $2',
        [activeApiKey, userId]
      );
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
