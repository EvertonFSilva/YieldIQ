import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { b3DividendProvider } from '../scrapers/B3DividendProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveDividendRule {
  id: string;
  userId?: string;
  phoneNumber?: string;
  groupName?: string;
  ticker: string;
}

export class DividendAlertWorker {
  private isExecutionInProgress: boolean = false;
  private alertedDividends = new Set<string>();

  private getSaoPauloDateString(): string {
    const saoPauloDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    );
    const calendarYear = saoPauloDate.getFullYear();
    const calendarMonth = String(saoPauloDate.getMonth() + 1).padStart(2, '0');
    const calendarDay = String(saoPauloDate.getDate()).padStart(2, '0');
    return `${calendarYear}-${calendarMonth}-${calendarDay}`;
  }

  public async executeCycle(): Promise<void> {
    if (this.isExecutionInProgress) {
      return;
    }

    if (!whatsAppService.isConnected()) {
      return;
    }

    this.isExecutionInProgress = true;

    try {
      const [userRulesResult, groupRulesResult] = await Promise.all([
        supabaseAdmin
          .from('asset_alert_rules')
          .select('id, user_id, is_notify_dividend, is_alert_enabled, assets!inner(ticker), users!inner(phone, is_whatsapp_enabled)')
          .eq('is_alert_enabled', true)
          .eq('is_notify_dividend', true),
        supabaseAdmin
          .from('admin_group_alerts')
          .select('id, group_name, is_notify_dividend, assets!inner(ticker)')
          .eq('is_notify_dividend', true)
      ]);

      const activeRules: ActiveDividendRule[] = [];

      for (const record of userRulesResult.data || []) {
        const userRelationship = record.users as any;
        const assetRelationship = record.assets as any;

        if (
          userRelationship?.is_whatsapp_enabled &&
          userRelationship?.phone &&
          assetRelationship?.ticker
        ) {
          activeRules.push({
            id: `user:${record.id}`,
            userId: record.user_id,
            phoneNumber: userRelationship.phone,
            ticker: assetRelationship.ticker
          });
        }
      }

      for (const record of groupRulesResult.data || []) {
        const assetRelationship = record.assets as any;
        if (record.group_name && assetRelationship?.ticker) {
          activeRules.push({
            id: `group:${record.id}`,
            groupName: record.group_name,
            ticker: assetRelationship.ticker
          });
        }
      }

      if (activeRules.length === 0) {
        return;
      }

      const uniqueTickers = Array.from(new Set(activeRules.map((rule) => rule.ticker)));
      const todayDateString = this.getSaoPauloDateString();

      for (const tickerSymbol of uniqueTickers) {
        try {
          const recentDividends = await b3DividendProvider.fetchAssetDividends(tickerSymbol, 3);
          if (!recentDividends || recentDividends.length === 0) {
            continue;
          }

          const mostRecentDividend = recentDividends[0];
          const dividendApprovedDate = mostRecentDividend.baseRecordDate || '';

          const isRecentAnnouncement = dividendApprovedDate >= todayDateString;
          const dividendUniqueKey = `${tickerSymbol}:${dividendApprovedDate}:${mostRecentDividend.value.getCentsAmount()}`;

          if (this.alertedDividends.has(dividendUniqueKey)) {
            continue;
          }

          if (isRecentAnnouncement) {
            this.alertedDividends.add(dividendUniqueKey);

            const dividendMessage =
              `💰 *NOVO PROVENTO ANUNCIADO - ${tickerSymbol}*\n\n` +
              `💵 Valor por Cota: *${mostRecentDividend.value.formatBrazilianReal()}*\n` +
              `📅 Data Com: *${mostRecentDividend.baseRecordDate}*\n` +
              `💳 Previsão de Pagamento: *${mostRecentDividend.paymentDistributionDate || 'A definir'}*\n` +
              `⏱️ Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

            const matchingRules = activeRules.filter((rule) => rule.ticker === tickerSymbol);

            for (const rule of matchingRules) {
              const destination = rule.phoneNumber || rule.groupName;
              if (!destination) {
                continue;
              }

              const wasSent = await whatsAppService.sendMessage(destination, dividendMessage, rule.userId);

              if (wasSent && rule.userId) {
                supabaseAdmin
                  .from('asset_alert_history')
                  .insert({
                    user_id: rule.userId,
                    alert_type: 'DIVIDEND',
                    message: dividendMessage,
                    sent_at: new Date().toISOString()
                  })
                  .then(undefined, () => {});
              }
            }
          }
        } catch (error) {
          LoggerUtils.error(`Failed to process dividend cycle for ${tickerSymbol}`, error, 'DividendAlertWorker');
        }
      }
    } catch (error) {
      LoggerUtils.error('DividendAlertWorker cycle execution failed', error, 'DividendAlertWorker');
    } finally {
      this.isExecutionInProgress = false;
    }
  }
}

export const dividendAlertWorker = new DividendAlertWorker();
