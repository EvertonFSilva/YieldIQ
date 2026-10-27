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
        .from('alert_rules')
        .select('*')
        .eq('channel_type', 'GROUP')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      response.json({
        success: true,
        data: (records || []).map((r) => ({
          id: r.id,
          group_name: r.channel_destination,
          ticker: r.target_symbol,
          alert_variation_pct: r.variation_step_percent,
          is_notify_dividend: r.notify_dividend,
          is_notify_material_fact: r.notify_document,
          is_notify_report: r.notify_document,
          is_active: r.is_active,
          created_at: r.created_at
        }))
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

      const { data: assetData } = await supabaseAdmin
        .from('assets')
        .select('id')
        .eq('ticker', cleanTicker)
        .maybeSingle();

      if (!assetData) {
        throw new NotFoundError(`Asset with ticker ${ticker} not found`);
      }

      const { data: existingRecord } = await supabaseAdmin
        .from('alert_rules')
        .select('id')
        .eq('channel_type', 'GROUP')
        .eq('channel_destination', cleanGroup)
        .eq('target_symbol', cleanTicker)
        .maybeSingle();

      if (existingRecord) {
        throw new ValidationError('Alert rule for this asset and group already exists');
      }

      const variationNumber =
        alert_variation_pct != null ? parseFloat(String(alert_variation_pct).replace(',', '.')) : null;

      const { data: insertedRecord, error: insertError } = await supabaseAdmin
        .from('alert_rules')
        .insert({
          channel_type: 'GROUP',
          channel_destination: cleanGroup,
          target_type: 'ASSET',
          target_symbol: cleanTicker,
          variation_step_percent: variationNumber,
          notify_dividend: Boolean(is_notify_dividend),
          notify_document: Boolean(is_notify_material_fact || is_notify_report),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
        .from('alert_rules')
        .delete()
        .eq('id', ruleIdentifier)
        .eq('channel_type', 'GROUP');

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
