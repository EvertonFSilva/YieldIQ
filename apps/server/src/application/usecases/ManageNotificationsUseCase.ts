import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { ValidationError, ExternalServiceError } from '../../domain/errors/AppError';

export class ManageNotificationsUseCase {
  public async retrieveNotifications(
    userId: string,
    pageNumber: number = 1,
    itemsPerPage: number = 20
  ): Promise<{ notifications: any[]; unreadCount: number }> {
    const calculationOffset = (pageNumber - 1) * itemsPerPage;

    const [notificationsResult, unreadCountResult] = await Promise.all([
      supabaseAdmin
        .from('notifications')
        .select('id, title, message, created_at, read')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(calculationOffset, calculationOffset + itemsPerPage - 1),
      supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
    ]);

    if (notificationsResult.error) {
      throw new ExternalServiceError('Failed to retrieve user notifications');
    }

    return {
      notifications: notificationsResult.data || [],
      unreadCount: unreadCountResult.count || 0
    };
  }

  public async retrieveUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new ExternalServiceError('Failed to retrieve unread notification count');
    }

    return count || 0;
  }

  public async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new ExternalServiceError('Failed to mark all notifications as read');
    }
  }

  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('id', notificationId);

    if (error) {
      throw new ExternalServiceError('Failed to mark notification as read');
    }
  }

  public async createBroadcastNotification(title: string, message: string): Promise<void> {
    if (!title || !title.trim()) {
      throw new ValidationError('Notification title is required');
    }

    const { data: users, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('id');

    if (userFetchError || !users) {
      throw new ExternalServiceError('Failed to retrieve target users for broadcast');
    }

    const currentTimestamp = new Date().toISOString();
    const notificationPayloads = users.map((user) => ({
      user_id: user.id,
      title: title.trim(),
      message: message ? message.trim() : '',
      read: false,
      created_at: currentTimestamp
    }));

    if (notificationPayloads.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationPayloads);

      if (insertError) {
        throw new ExternalServiceError('Failed to insert broadcast notifications');
      }
    }
  }
}
