import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { treasuryDirectProvider } from '../scrapers/TreasuryDirectProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveTreasuryRule {
  id: string;
  userId?: string;
  destination: string;
  bondName: string;
  variationPercentageThreshold: number | null;
}

export class TreasuryAlertWorker {
  private isExecutionInProgress: boolean = false;
  private alertedBondLevels = new Map<string, Set<number>>();

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
        .eq('target_type', 'TREASURY');

      if (error || !records || records.length === 0) {
        return;
      }

      const activeRules: ActiveTreasuryRule[] = records
        .filter((r) => Boolean(r.channel_destination && r.target_symbol))
        .map((r) => ({
          id: String(r.id),
          userId: r.user_id || undefined,
          destination: r.channel_destination,
          bondName: r.target_symbol.trim(),
          variationPercentageThreshold: r.variation_step_percent
        }));

      if (activeRules.length === 0) {
        return;
      }

      const treasuryBonds = await treasuryDirectProvider.fetchTreasuryBonds();
      if (!treasuryBonds || treasuryBonds.length === 0) {
        return;
      }

      const todayDateString = this.getSaoPauloDateString();

      for (const bondItem of treasuryBonds) {
        const matchingRules = activeRules.filter(
          (rule) => rule.bondName.toLowerCase() === bondItem.bondName.toLowerCase()
        );

        if (matchingRules.length === 0) {
          continue;
        }

        for (const rule of matchingRules) {
          if (
            rule.variationPercentageThreshold != null &&
            rule.variationPercentageThreshold >= 0.1
          ) {
            const threshold = rule.variationPercentageThreshold;
            const rate = bondItem.profitabilityRate;
            const absoluteVariation = Math.abs(rate);
            const integerLevel = Math.floor(absoluteVariation / threshold);

            if (integerLevel >= 1) {
              const direction = rate >= 0 ? 'UP' : 'DOWN';
              const trackingKey = `${todayDateString}:${rule.id}:${direction}`;

              if (!this.alertedBondLevels.has(trackingKey)) {
                this.alertedBondLevels.set(trackingKey, new Set<number>());
              }

              const notifiedLevels = this.alertedBondLevels.get(trackingKey)!;

              if (!notifiedLevels.has(integerLevel)) {
                notifiedLevels.add(integerLevel);

                const unitPriceFormatted = bondItem.unitPrice ? bondItem.unitPrice.formatBrazilianReal() : 'N/A';
                const treasuryMessage =
                  `🏛️ *ALERTA DO TESOURO DIRETO*\n\n` +
                  `📌 Título: *${bondItem.bondName}*\n` +
                  `📊 Rentabilidade: *${bondItem.profitabilityRateRaw}*\n` +
                  `💵 Preço Unitário: *${unitPriceFormatted}*\n` +
                  `⏱️ Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

                const wasSent = await whatsAppService.sendMessage(
                  rule.destination,
                  treasuryMessage,
                  rule.userId
                );

                if (wasSent) {
                  supabaseAdmin
                    .from('alert_logs')
                    .insert({
                      rule_id: rule.id,
                      user_id: rule.userId,
                      channel_destination: rule.destination,
                      target_symbol: bondItem.bondName,
                      alert_type: 'TREASURY_VARIATION',
                      message: treasuryMessage,
                      sent_at: new Date().toISOString()
                    })
                    .then(undefined, () => {});
                }
              }
            }
          }
        }
      }
    } catch (error) {
      LoggerUtils.error('TreasuryAlertWorker cycle execution failed', error, 'TreasuryAlertWorker');
    } finally {
      this.isExecutionInProgress = false;
    }
  }
}

export const treasuryAlertWorker = new TreasuryAlertWorker();
