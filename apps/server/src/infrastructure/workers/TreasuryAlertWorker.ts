import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { treasuryDirectProvider } from '../scrapers/TreasuryDirectProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveTreasuryRule {
  id: string;
  userId: string;
  phoneNumber: string;
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
        .from('treasury_alert_rules')
        .select('id, user_id, alert_variation_pct, is_alert_enabled, treasury!inner(name), users!inner(phone, is_whatsapp_enabled)')
        .eq('is_alert_enabled', true);

      if (error || !records || records.length === 0) {
        return;
      }

      const activeRules: ActiveTreasuryRule[] = [];

      for (const record of records) {
        const userRelationship = record.users as any;
        const treasuryRelationship = record.treasury as any;

        if (
          userRelationship?.is_whatsapp_enabled &&
          userRelationship?.phone &&
          treasuryRelationship?.name
        ) {
          activeRules.push({
            id: String(record.id),
            userId: record.user_id,
            phoneNumber: userRelationship.phone,
            bondName: treasuryRelationship.name.trim(),
            variationPercentageThreshold: record.alert_variation_pct
          });
        }
      }

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
                  rule.phoneNumber,
                  treasuryMessage,
                  rule.userId
                );

                if (wasSent) {
                  supabaseAdmin
                    .from('treasury_alert_history')
                    .insert({
                      user_id: rule.userId,
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
