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
        .filter((r) => Boolean(r.destination && r.target_symbol))
        .map((r) => {
          const settings = r.settings || {};
          return {
            id: String(r.id),
            userId: r.user_id || undefined,
            destination: r.destination,
            bondName: r.target_symbol.trim(),
            variationPercentageThreshold: settings.variation_step != null ? Number(settings.variation_step) : null
          };
        });

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

                const directionArrow = rate >= 0 ? '🟢 ↗️' : '🔴 ↘️';
                const message =
                  `🏛️ *ALERTA DE TAXA - ${bondItem.bondName}*\n\n` +
                  `${directionArrow} A rentabilidade do título atingiu *${bondItem.rateDescription}* ao ano!\n` +
                  `💵 Preço Unitário: *${bondItem.unitPrice ? `R$ ${bondItem.unitPrice.getAmount().toFixed(2)}` : 'Indisponível'}*\n` +
                  `⏱️ Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

                const wasSent = await whatsAppService.sendMessage(rule.destination, message, rule.userId);

                if (wasSent) {
                  supabaseAdmin
                    .from('alert_logs')
                    .insert({
                      rule_id: rule.id,
                      user_id: rule.userId,
                      destination: rule.destination,
                      target_symbol: bondItem.bondName,
                      alert_type: 'PRICE_VARIATION',
                      message: message,
                      payload: {
                        rate: bondItem.profitabilityRate,
                        rate_description: bondItem.rateDescription,
                        unit_price: bondItem.unitPrice?.getAmount()
                      },
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
