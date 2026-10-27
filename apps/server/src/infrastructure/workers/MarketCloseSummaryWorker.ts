import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { yahooPriceProvider } from '../scrapers/YahooPriceProvider';
import { LoggerUtils } from '../utils/Logger';

export class MarketCloseSummaryWorker {
  private lastDeliveredDate: string = '';

  private getSaoPauloDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  }

  public async executeCycle(): Promise<void> {
    if (!whatsAppService.isConnected()) {
      return;
    }

    const saoPauloDate = this.getSaoPauloDate();
    const dayOfWeek = saoPauloDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return;
    }

    const currentHour = saoPauloDate.getHours();
    const currentMinute = saoPauloDate.getMinutes();

    const isAfterClose = currentHour === 17 && currentMinute >= 15;
    if (!isAfterClose) {
      return;
    }

    const todayDateString = saoPauloDate.toISOString().split('T')[0];
    if (this.lastDeliveredDate === todayDateString) {
      return;
    }

    try {
      const { data: groupRecords } = await supabaseAdmin
        .from('alert_rules')
        .select('destination, target_symbol')
        .eq('is_active', true)
        .eq('channel_type', 'GROUP')
        .eq('target_type', 'ASSET');

      if (!groupRecords || groupRecords.length === 0) {
        return;
      }

      const groupsMap = new Map<string, Set<string>>();
      for (const record of groupRecords) {
        const groupName = record.destination;
        const ticker = record.target_symbol;

        if (groupName && ticker) {
          if (!groupsMap.has(groupName)) {
            groupsMap.set(groupName, new Set<string>());
          }
          groupsMap.get(groupName)!.add(ticker);
        }
      }

      for (const [groupName, tickersSet] of groupsMap) {
        const tickersList = Array.from(tickersSet);
        const assetSummaries: Array<{ ticker: string; price: number; changePercent: number }> = [];

        for (const tickerSymbol of tickersList) {
          try {
            const priceQuote = await yahooPriceProvider.fetchAssetPrice(tickerSymbol);
            if (priceQuote && priceQuote.currentPrice.getAmount() > 0) {
              assetSummaries.push({
                ticker: tickerSymbol,
                price: priceQuote.currentPrice.getAmount(),
                changePercent: priceQuote.calculateDailyVariationPercentage()
              });
            }
          } catch {
          }
        }

        if (assetSummaries.length === 0) {
          continue;
        }

        assetSummaries.sort((first, second) => second.changePercent - first.changePercent);

        let summaryMessage =
          `📊 *FECHAMENTO DE MERCADO - YIELDIQ*\n` +
          `📅 Data: ${saoPauloDate.toLocaleDateString('pt-BR')}\n\n` +
          `Resumo de performance dos ativos acompanhados:\n\n`;

        for (const assetItem of assetSummaries) {
          const arrow = assetItem.changePercent >= 0 ? '🟢 ↗️' : '🔴 ↘️';
          const directionText =
            assetItem.changePercent >= 0
              ? `+${Math.abs(assetItem.changePercent).toFixed(2)}%`
              : `-${Math.abs(assetItem.changePercent).toFixed(2)}%`;

          summaryMessage += `${arrow} *${assetItem.ticker}*: R$ ${assetItem.price.toFixed(2)} (${directionText})\n`;
        }

        const delivered = await whatsAppService.sendMessage(groupName, summaryMessage);

        if (delivered) {
          supabaseAdmin
            .from('alert_logs')
            .insert({
              destination: groupName,
              target_symbol: 'MARKET',
              alert_type: 'MARKET_SUMMARY',
              message: summaryMessage,
              payload: {
                assets_count: assetSummaries.length,
                date: todayDateString
              },
              sent_at: new Date().toISOString()
            })
            .then(undefined, () => {});
        }
      }

      this.lastDeliveredDate = todayDateString;
    } catch (error) {
      LoggerUtils.error('MarketCloseSummaryWorker cycle failed', error, 'MarketCloseSummaryWorker');
    }
  }
}

export const marketCloseSummaryWorker = new MarketCloseSummaryWorker();
