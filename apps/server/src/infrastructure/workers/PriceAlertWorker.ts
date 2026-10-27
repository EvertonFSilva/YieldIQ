import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { yahooPriceProvider } from '../scrapers/YahooPriceProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveAlertRuleRecord {
  id: string;
  userId?: string;
  destination: string;
  ticker: string;
  minimumTargetPrice?: number | null;
  maximumTargetPrice?: number | null;
  variationPercentageThreshold?: number | null;
  isPriceAlertEnabled?: boolean;
}

export class PriceAlertWorker {
  private isExecutionInProgress: boolean = false;
  private triggeredThresholdLevels = new Map<string, Set<number>>();
  private triggeredLimitTargets = new Map<string, Set<string>>();

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
      const todayDateString = this.getSaoPauloDateString();

      const { data: records, error } = await supabaseAdmin
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)
        .eq('target_type', 'ASSET');

      if (error || !records || records.length === 0) {
        return;
      }

      const activeRules: ActiveAlertRuleRecord[] = records
        .filter((r) => Boolean(r.channel_destination && r.target_symbol))
        .map((r) => ({
          id: r.id,
          userId: r.user_id || undefined,
          destination: r.channel_destination,
          ticker: r.target_symbol,
          minimumTargetPrice: r.price_target_min,
          maximumTargetPrice: r.price_target_max,
          variationPercentageThreshold: r.variation_step_percent,
          isPriceAlertEnabled: Boolean(r.notify_price)
        }));

      if (activeRules.length === 0) {
        return;
      }

      const uniqueTickers = Array.from(new Set(activeRules.map((rule) => rule.ticker)));

      for (const tickerSymbol of uniqueTickers) {
        try {
          const priceQuote = await yahooPriceProvider.fetchAssetPrice(tickerSymbol);
          if (!priceQuote || priceQuote.currentPrice.getAmount() <= 0) {
            continue;
          }

          const currentPrice = priceQuote.currentPrice.getAmount();
          const changePercentage = priceQuote.calculateDailyVariationPercentage();
          const matchingRules = activeRules.filter((rule) => rule.ticker === tickerSymbol);

          for (const rule of matchingRules) {
            const destination = rule.destination;
            if (!destination) {
              continue;
            }

            if (
              rule.variationPercentageThreshold != null &&
              rule.variationPercentageThreshold >= 0.1
            ) {
              const threshold = rule.variationPercentageThreshold;
              const absolutePercentage = Math.abs(changePercentage);
              const integerLevelReached = Math.floor(absolutePercentage / threshold);

              if (integerLevelReached >= 1) {
                const directionIdentifier = changePercentage >= 0 ? 'UP' : 'DOWN';
                const trackingKey = `${todayDateString}:${rule.id}:${directionIdentifier}`;

                if (!this.triggeredThresholdLevels.has(trackingKey)) {
                  this.triggeredThresholdLevels.set(trackingKey, new Set<number>());
                }

                const notifiedLevels = this.triggeredThresholdLevels.get(trackingKey)!;

                if (!notifiedLevels.has(integerLevelReached)) {
                  notifiedLevels.add(integerLevelReached);

                  const directionText =
                    changePercentage >= 0
                      ? `subiu +${absolutePercentage.toFixed(2)}%`
                      : `caiu -${absolutePercentage.toFixed(2)}%`;
                  const directionIndicator = changePercentage >= 0 ? '🟢 ↗️' : '🔴 ↘️';

                  const notificationMessage =
                    `🔔 *ALERTA DE VARIAÇÃO - ${tickerSymbol}*\n\n` +
                    `${directionIndicator} O ativo *${tickerSymbol}* ${directionText} hoje!\n` +
                    `💵 Preço Atual: *R$ ${currentPrice.toFixed(2)}*\n` +
                    `📊 Meta de Variação Atingida: *${(integerLevelReached * threshold).toFixed(2)}%*\n` +
                    `⏱️ Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

                  const wasSentSuccessfully = await whatsAppService.sendMessage(
                    destination,
                    notificationMessage,
                    rule.userId
                  );

                  if (wasSentSuccessfully) {
                    supabaseAdmin
                      .from('alert_logs')
                      .insert({
                        rule_id: rule.id,
                        user_id: rule.userId,
                        channel_destination: destination,
                        target_symbol: tickerSymbol,
                        alert_type: 'PRICE_VARIATION',
                        message: notificationMessage,
                        sent_at: new Date().toISOString()
                      })
                      .then(undefined, () => {});
                  }
                }
              }
            }

            if (rule.isPriceAlertEnabled) {
              const limitsTrackingKey = `${todayDateString}:${rule.id}`;
              if (!this.triggeredLimitTargets.has(limitsTrackingKey)) {
                this.triggeredLimitTargets.set(limitsTrackingKey, new Set<string>());
              }
              const notifiedLimits = this.triggeredLimitTargets.get(limitsTrackingKey)!;

              if (
                rule.minimumTargetPrice != null &&
                currentPrice <= rule.minimumTargetPrice &&
                !notifiedLimits.has('PRICE_MIN')
              ) {
                notifiedLimits.add('PRICE_MIN');
                const minimumAlertMessage =
                  `🎯 *ALERTA DE PREÇO MÍNIMO - ${tickerSymbol}*\n\n` +
                  `📉 O ativo atingiu o piso configurado!\n` +
                  `💵 Preço Atual: *R$ ${currentPrice.toFixed(2)}*\n` +
                  `🎯 Preço Alvo Mínimo: *R$ ${rule.minimumTargetPrice.toFixed(2)}*\n` +
                  `⏱️ Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

                const wasSentSuccessfully = await whatsAppService.sendMessage(
                  destination,
                  minimumAlertMessage,
                  rule.userId
                );

                if (wasSentSuccessfully) {
                  supabaseAdmin
                    .from('alert_logs')
                    .insert({
                      rule_id: rule.id,
                      user_id: rule.userId,
                      channel_destination: destination,
                      target_symbol: tickerSymbol,
                      alert_type: 'PRICE_MIN',
                      message: minimumAlertMessage,
                      sent_at: new Date().toISOString()
                    })
                    .then(undefined, () => {});
                }
              }

              if (
                rule.maximumTargetPrice != null &&
                currentPrice >= rule.maximumTargetPrice &&
                !notifiedLimits.has('PRICE_MAX')
              ) {
                notifiedLimits.add('PRICE_MAX');
                const maximumAlertMessage =
                  `🎯 *ALERTA DE PREÇO MÁXIMO - ${tickerSymbol}*\n\n` +
                  `📈 O ativo atingiu o teto configurado!\n` +
                  `💵 Preço Atual: *R$ ${currentPrice.toFixed(2)}*\n` +
                  `🎯 Preço Alvo Máximo: *R$ ${rule.maximumTargetPrice.toFixed(2)}*\n` +
                  `⏱️ Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

                const wasSentSuccessfully = await whatsAppService.sendMessage(
                  destination,
                  maximumAlertMessage,
                  rule.userId
                );

                if (wasSentSuccessfully) {
                  supabaseAdmin
                    .from('alert_logs')
                    .insert({
                      rule_id: rule.id,
                      user_id: rule.userId,
                      channel_destination: destination,
                      target_symbol: tickerSymbol,
                      alert_type: 'PRICE_MAX',
                      message: maximumAlertMessage,
                      sent_at: new Date().toISOString()
                    })
                    .then(undefined, () => {});
                }
              }
            }
          }
        } catch (error) {
          LoggerUtils.error(`Failed to process price alert cycle for ${tickerSymbol}`, error, 'PriceAlertWorker');
        }
      }
    } catch (error) {
      LoggerUtils.error('PriceAlertWorker cycle execution failed', error, 'PriceAlertWorker');
    } finally {
      this.isExecutionInProgress = false;
    }
  }
}

export const priceAlertWorker = new PriceAlertWorker();
