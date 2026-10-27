import { Request, Response, NextFunction } from 'express';
import { whatsAppService } from '../../infrastructure/notifications/WhatsAppNotificationService';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
import { SyncAssetsUseCase } from '../../application/usecases/SyncAssetsUseCase';
import { ForbiddenError, ValidationError, NotFoundError } from '../../domain/errors/AppError';

export class AdminController {
  private ensureAdminPrivilege(request: Request): void {
    const userRole = request.user?.role || (request.user as any)?.privilege;
    if (userRole !== 'ADMINISTRATOR' && userRole !== 'admin') {
      throw new ForbiddenError('Administrative privilege required');
    }
  }

  public retrieveWhatsAppStatus = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const statusData = whatsAppService.getStatus();
      response.json({
        success: true,
        data: statusData
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public initializeWhatsApp = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      await whatsAppService.initialize();
      response.json({
        success: true,
        data: { message: 'WhatsApp initialization triggered' }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public disconnectWhatsApp = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      await whatsAppService.disconnect();
      response.json({
        success: true,
        data: { message: 'WhatsApp disconnected and credentials cleared' }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveWhatsAppGroups = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const groups = await whatsAppService.getParticipatingGroups();
      response.json({
        success: true,
        data: groups
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveGroupAlerts = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const queryResult = await postgresDatabase.query(
        `SELECT id, destination, target_symbol, settings, is_active, created_at
         FROM public.alert_rules
         WHERE channel_type = 'GROUP'
         ORDER BY created_at DESC`
      );

      const records = queryResult.rows || [];

      response.json({
        success: true,
        data: records.map((r: any) => {
          const settings = r.settings || {};
          return {
            id: r.id,
            group_name: r.destination,
            ticker: r.target_symbol,
            alert_variation_pct: settings.variation_step != null ? Number(settings.variation_step) : null,
            is_notify_dividend: settings.notify_dividends !== false,
            is_notify_material_fact: settings.notify_documents !== false,
            is_notify_report: settings.notify_documents !== false,
            is_active: r.is_active,
            created_at: r.created_at
          };
        })
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public createGroupAlert = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const {
        ticker,
        group_name,
        is_notify_dividend,
        alert_variation_pct,
        is_notify_material_fact,
        is_notify_report
      } = request.body;

      if (!ticker || !group_name) {
        throw new ValidationError('Ticker and group_name are required fields');
      }

      const cleanTicker = ticker.toUpperCase().trim();
      const cleanGroup = group_name.trim();

      const assetCheckResult = await postgresDatabase.query(
        'SELECT id FROM public.assets WHERE ticker = $1 LIMIT 1',
        [cleanTicker]
      );

      if (assetCheckResult.rows.length === 0) {
        throw new NotFoundError(`Asset with ticker ${ticker} not found`);
      }

      const existingRecordResult = await postgresDatabase.query(
        `SELECT id FROM public.alert_rules
         WHERE channel_type = 'GROUP' AND destination = $1 AND target_symbol = $2
         LIMIT 1`,
        [cleanGroup, cleanTicker]
      );

      if (existingRecordResult.rows.length > 0) {
        throw new ValidationError('Alert rule for this asset and group already exists');
      }

      const variationNumber =
        alert_variation_pct != null ? parseFloat(String(alert_variation_pct).replace(',', '.')) : null;

      const settings = {
        variation_step: variationNumber,
        notify_dividends: Boolean(is_notify_dividend),
        notify_documents: Boolean(is_notify_material_fact || is_notify_report)
      };

      const insertResult = await postgresDatabase.query(
        `INSERT INTO public.alert_rules (channel_type, destination, target_type, target_symbol, settings, is_active, created_at, updated_at)
         VALUES ('GROUP', $1, 'ASSET', $2, $3::jsonb, true, NOW(), NOW())
         RETURNING *`,
        [cleanGroup, cleanTicker, JSON.stringify(settings)]
      );

      response.status(201).json({
        success: true,
        data: insertResult.rows[0]
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public deleteGroupAlert = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const ruleIdentifier = request.params.id;

      await postgresDatabase.query(
        "DELETE FROM public.alert_rules WHERE id = $1 AND channel_type = 'GROUP'",
        [ruleIdentifier]
      );

      response.json({
        success: true,
        data: null
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public listUsers = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const usersResult = await postgresDatabase.query(
        `SELECT id, username, email, phone_number, role, alert_quota, created_at
         FROM public.users
         ORDER BY created_at DESC`
      );

      response.json({
        success: true,
        data: usersResult.rows || []
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public updateUserPrivileges = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const targetUserId = request.params.id;
      const { username, email, phone_number, role, alertQuota, privilege, ruleLimit } = request.body;

      const targetRole = role || (privilege ? privilege.toUpperCase() : undefined);
      const targetQuota = alertQuota ?? ruleLimit;

      const fieldsToUpdate: string[] = [];
      const queryValues: any[] = [];
      let parameterIndex = 1;

      if (username) {
        fieldsToUpdate.push(`username = $${parameterIndex++}`);
        queryValues.push(username.trim());
      }
      if (email) {
        fieldsToUpdate.push(`email = $${parameterIndex++}`);
        queryValues.push(email.trim().toLowerCase());
      }
      if (phone_number !== undefined) {
        fieldsToUpdate.push(`phone_number = $${parameterIndex++}`);
        queryValues.push(phone_number ? phone_number.trim() : null);
      }
      if (targetRole) {
        fieldsToUpdate.push(`role = $${parameterIndex++}`);
        queryValues.push(targetRole);
      }
      if (targetQuota !== undefined) {
        fieldsToUpdate.push(`alert_quota = $${parameterIndex++}`);
        queryValues.push(Number(targetQuota));
      }

      if (fieldsToUpdate.length > 0) {
        fieldsToUpdate.push('updated_at = NOW()');
        queryValues.push(targetUserId);

        const updateQuery = `
          UPDATE public.users
          SET ${fieldsToUpdate.join(', ')}
          WHERE id = $${parameterIndex}
          RETURNING id, username, email, phone_number, role, alert_quota, created_at, updated_at
        `;

        const queryResult = await postgresDatabase.query(updateQuery, queryValues);
        if (queryResult.rows.length === 0) {
          throw new NotFoundError('User not found');
        }

        response.json({
          success: true,
          data: queryResult.rows[0]
        });
        return;
      }

      response.json({
        success: true,
        data: { message: 'No changes provided' }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public syncAssets = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      this.ensureAdminPrivilege(request);
      const syncUseCase = new SyncAssetsUseCase();
      const syncResult = await syncUseCase.execute();
      response.json({
        success: true,
        data: syncResult
      });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const adminController = new AdminController();
