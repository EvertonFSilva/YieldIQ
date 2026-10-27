import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { b3DividendProvider } from '../scrapers/B3DividendProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveDividendRule {
  id: string;
  userId?: string;
  destination: string;
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
      const { data: records, error } = await supabaseAdmin
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)
        .eq('notify_dividend', true)
        .eq('target_type', 'ASSET');

      if (error || !records || records.length === 0) {
        return;
      }

      const activeRules: ActiveDividendRule[] = records
        .filter((r) => Boolean(r.channel_destination && r.target_symbol))
        .map((r) => ({
          id: r.id,
          userId: r.user_id || undefined,
          destination: r.channel_destination,
          ticker: r.target_symbol
        }));

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
              const destination = rule.destination;
              if (!destination) {
                continue;
              }

              const wasSent = await whatsAppService.sendMessage(destination, dividendMessage, rule.userId);

              if (wasSent) {
                supabaseAdmin
                  .from('alert_logs')
                  .insert({
                    rule_id: rule.id,
                    user_id: rule.userId,
                    channel_destination: destination,
                    target_symbol: tickerSymbol,
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
