import { Request, Response, NextFunction } from 'express';
import { ManageAlertRulesUseCase } from '../../application/usecases/ManageAlertRulesUseCase';
import { whatsAppService } from '../../infrastructure/notifications/WhatsAppNotificationService';
import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { UnauthorizedError, ValidationError, ExternalServiceError } from '../../domain/errors/AppError';

export class AlertController {
  private readonly manageAlertRulesUseCase = new ManageAlertRulesUseCase();

  public retrieveRules = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const rules = await this.manageAlertRulesUseCase.retrieveRules(currentUserId);
      response.json({
        success: true,
        data: rules
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public upsertRule = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const result = await this.manageAlertRulesUseCase.upsertRule(currentUserId, request.body);
      response.json({
        success: true,
        data: result
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public deleteRule = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const ruleIdentifier = request.params.id;
      await this.manageAlertRulesUseCase.deleteRule(currentUserId, ruleIdentifier);
      response.json({
        success: true,
        data: null
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public toggleRule = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const ruleIdentifier = request.params.id;
      const { is_alert_enabled, enabled } = request.body;
      const targetFlag = is_alert_enabled !== undefined ? is_alert_enabled : enabled;

      if (typeof targetFlag !== 'boolean') {
        throw new ValidationError('Boolean value required for alert toggle state');
      }

      await this.manageAlertRulesUseCase.toggleRule(currentUserId, ruleIdentifier, targetFlag);
      response.json({
        success: true,
        data: null
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveHistory = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const history = await this.manageAlertRulesUseCase.retrieveHistory(currentUserId);
      response.json({
        success: true,
        data: history
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveTreasuryRules = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const result = await this.manageAlertRulesUseCase.retrieveTreasuryRules(currentUserId);
      response.json({
        success: true,
        data: result
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public updateTreasuryRules = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { bonds } = request.body;
      const result = await this.manageAlertRulesUseCase.updateTreasuryRules(currentUserId, bonds);
      response.json({
        success: true,
        data: result
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public sendTestWhatsAppMessage = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('phone')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!userRecord || !userRecord.phone) {
        throw new ValidationError('Configure a phone number in your profile before requesting test alerts');
      }

      if (!whatsAppService.isConnected()) {
        throw new ExternalServiceError('WhatsApp service is disconnected. Contact system administrator.');
      }

      const testContent =
        `🤖 *Mensagem de Teste - YieldIQ*\n\n` +
        `Olá! Seus alertas via WhatsApp estão configurados e funcionando perfeitamente!`;

      const deliverySucceeded = await whatsAppService.sendMessage(userRecord.phone, testContent, currentUserId);

      if (!deliverySucceeded) {
        throw new ExternalServiceError('Delivery of test message failed. Check recipient status.');
      }

      response.json({
        success: true,
        data: { message: 'Test message sent successfully' }
      });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const alertController = new AlertController();
