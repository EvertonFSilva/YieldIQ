import { Request, Response, NextFunction } from 'express';
import { whatsAppService } from '../../infrastructure/notifications/WhatsAppNotificationService';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { ForbiddenError, ValidationError, NotFoundError } from '../../domain/errors/AppError';

export class AdminController {
  private ensureAdminPrivilege(request: Request): void {
    if (request.user?.privilege !== 'admin') {
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
      const { data: records, error } = await supabaseAdmin
        .from('admin_group_alerts')
        .select('*, assets(ticker)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      response.json({
        success: true,
        data: records || []
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
        is_notify_report,
        is_notify_public_offering
      } = request.body;

      if (!ticker || !group_name) {
        throw new ValidationError('Ticker and group_name are required fields');
      }

      const { data: assetData } = await supabaseAdmin
        .from('assets')
        .select('id')
        .eq('ticker', ticker.toUpperCase().trim())
        .maybeSingle();

      if (!assetData) {
        throw new NotFoundError(`Asset with ticker ${ticker} not found`);
      }

      const { data: existingRecord } = await supabaseAdmin
        .from('admin_group_alerts')
        .select('id')
        .eq('asset_id', assetData.id)
        .eq('group_name', group_name.trim())
        .maybeSingle();

      if (existingRecord) {
        throw new ValidationError('Alert rule for this asset and group already exists');
      }

      const variationNumber =
        alert_variation_pct != null ? parseFloat(String(alert_variation_pct).replace(',', '.')) : null;

      const { data: insertedRecord, error: insertError } = await supabaseAdmin
        .from('admin_group_alerts')
        .insert({
          asset_id: assetData.id,
          group_name: group_name.trim(),
          is_notify_dividend: Boolean(is_notify_dividend),
          alert_variation_pct: variationNumber,
          is_notify_material_fact: Boolean(is_notify_material_fact),
          is_notify_report: Boolean(is_notify_report),
          is_notify_public_offering: Boolean(is_notify_public_offering)
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      response.status(201).json({
        success: true,
        data: insertedRecord
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

      const { error } = await supabaseAdmin
        .from('admin_group_alerts')
        .delete()
        .eq('id', ruleIdentifier);

      if (error) {
        throw error;
      }

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
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, username, email, phone, privilege, rule_limit, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      response.json({
        success: true,
        data: users || []
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
      const { privilege, ruleLimit } = request.body;

      const updatePayload: Record<string, any> = {};
      if (privilege) {
        updatePayload.privilege = privilege;
      }
      if (ruleLimit !== undefined) {
        updatePayload.rule_limit = ruleLimit;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', targetUserId);

      if (error) {
        throw error;
      }

      response.json({
        success: true,
        data: { message: 'User updated successfully' }
      });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const adminController = new AdminController();
