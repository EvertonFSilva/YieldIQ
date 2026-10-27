import { IPriceProvider } from '../../domain/ports/IPriceProvider';
import { ICacheService } from '../../domain/ports/ICacheService';
import { PriceQuote } from '../../domain/entities/PriceQuote';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment } from '../../config/env';

export class RetrieveAssetPriceUseCase {
  constructor(
    private readonly priceProvider: IPriceProvider,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(
    tickerSymbol: string,
    timeRange: string = '1d',
    dataInterval: string = '1d'
  ): Promise<PriceQuote> {
    const assetTicker = new Ticker(tickerSymbol);
    const cacheKey = `price:${assetTicker.getSymbol()}:${timeRange}:${dataInterval}`;

    const cachedRecord = await this.cacheService.get<any>(cacheKey);
    if (cachedRecord && cachedRecord.currentPrice > 0) {
      return new PriceQuote(cachedRecord);
    }

    const staleRecord = await this.cacheService.getStale<any>(cacheKey);
    if (staleRecord && staleRecord.value?.currentPrice > 0) {
      this.revalidatePriceInBackground(cacheKey, assetTicker, timeRange, dataInterval);
      return new PriceQuote(staleRecord.value);
    }

    const freshQuote = await this.priceProvider.fetchAssetPrice(assetTicker, timeRange, dataInterval);
    if (freshQuote.currentPrice.getAmount() > 0) {
      await this.cacheService.set(cacheKey, freshQuote.toJSON(), environment.YAHOO_CACHE_TTL_MS);
    }

    return freshQuote;
  }

  private revalidatePriceInBackground(
    cacheKey: string,
    assetTicker: Ticker,
    timeRange: string,
    dataInterval: string
  ): void {
    this.priceProvider
      .fetchAssetPrice(assetTicker, timeRange, dataInterval)
      .then((freshQuote) => {
        if (freshQuote.currentPrice.getAmount() > 0) {
          this.cacheService.set(cacheKey, freshQuote.toJSON(), environment.YAHOO_CACHE_TTL_MS);
        }
      })
      .catch(() => {});
  }
}
