import axios from 'axios';
import { IPriceProvider } from '../../domain/ports/IPriceProvider';
import { PriceQuote } from '../../domain/entities/PriceQuote';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment } from '../../config/env';
import { LoggerUtils } from '../utils/Logger';

export class YahooPriceProvider implements IPriceProvider {
  private readonly baseUrl: string;
  private readonly requestTimeoutMilliseconds: number;

  constructor() {
    this.baseUrl = environment.YAHOO_FINANCE_BASE_URL;
    this.requestTimeoutMilliseconds = environment.HTTP_DEFAULT_TIMEOUT_MS;
  }

  public async fetchAssetPrice(
    tickerInput: Ticker | string,
    timeRange: string = '1d',
    dataInterval: string = '1d'
  ): Promise<PriceQuote> {
    const assetTicker = tickerInput instanceof Ticker ? tickerInput : new Ticker(tickerInput);
    const yahooSymbol = assetTicker.toYahooFinanceSymbol();
    const requestUrl = `${this.baseUrl}/v8/finance/chart/${yahooSymbol}?range=${timeRange}&interval=${dataInterval}`;

    try {
      const response = await axios.get(requestUrl, {
        timeout: this.requestTimeoutMilliseconds,
        headers: {
          'User-Agent': environment.USER_AGENT,
          'Accept': 'application/json'
        }
      });

      const chartResult = response.data?.chart?.result?.[0];
      if (!chartResult || !chartResult.meta) {
        return new PriceQuote({ currentPrice: 0 });
      }

      const metadata = chartResult.meta;
      const quoteIndicators = chartResult.indicators?.quote?.[0] || {};

      const currentPrice = metadata.regularMarketPrice || 0;
      const previousClose = metadata.chartPreviousClose || metadata.previousClose || 0;
      const openingPrice = quoteIndicators.open?.[0] || metadata.regularMarketDayLow || null;
      const dayHighPrice = metadata.regularMarketDayHigh || null;
      const dayLowPrice = metadata.regularMarketDayLow || null;
      const tradingVolume = metadata.regularMarketVolume || 0;
      const fiftyTwoWeekHighPrice = metadata.fiftyTwoWeekHigh || null;
      const fiftyTwoWeekLowPrice = metadata.fiftyTwoWeekLow || null;
      const assetDescription = metadata.shortName || metadata.longName || assetTicker.getSymbol();

      return new PriceQuote({
        currentPrice,
        previousClose,
        openingPrice,
        dayHighPrice,
        dayLowPrice,
        tradingVolume,
        fiftyTwoWeekHighPrice,
        fiftyTwoWeekLowPrice,
        assetDescription
      });
    } catch (error: any) {
      LoggerUtils.error(`YahooPriceProvider error for ${assetTicker.getSymbol()}: ${error.message}`);
      return new PriceQuote({ currentPrice: 0 });
    }
  }
}

export const yahooPriceProvider = new YahooPriceProvider();
