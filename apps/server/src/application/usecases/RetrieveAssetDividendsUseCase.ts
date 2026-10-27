import { IDividendProvider } from '../../domain/ports/IDividendProvider';
import { ICacheService } from '../../domain/ports/ICacheService';
import { Dividend } from '../../domain/entities/Dividend';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment } from '../../config/env';

export class RetrieveAssetDividendsUseCase {
  constructor(
    private readonly dividendProvider: IDividendProvider,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(
    tickerSymbol: string,
    maximumRecords: number = 12
  ): Promise<Dividend[]> {
    const assetTicker = new Ticker(tickerSymbol);
    const cacheKey = `dividends:${assetTicker.getSymbol()}:${maximumRecords}`;

    const cachedRecords = await this.cacheService.get<any[]>(cacheKey);
    if (cachedRecords && Array.isArray(cachedRecords) && cachedRecords.length > 0) {
      return cachedRecords.map((item) => new Dividend(item));
    }

    const staleRecord = await this.cacheService.getStale<any[]>(cacheKey);
    if (staleRecord && Array.isArray(staleRecord.value) && staleRecord.value.length > 0) {
      this.revalidateDividendsInBackground(cacheKey, assetTicker, maximumRecords);
      return staleRecord.value.map((item) => new Dividend(item));
    }

    const freshDividends = await this.dividendProvider.fetchAssetDividends(assetTicker, maximumRecords);
    if (freshDividends.length > 0) {
      await this.cacheService.set(
        cacheKey,
        freshDividends.map((item) => item.toJSON()),
        environment.B3_CACHE_TTL_MS
      );
    }

    return freshDividends;
  }

  private revalidateDividendsInBackground(
    cacheKey: string,
    assetTicker: Ticker,
    maximumRecords: number
  ): void {
    this.dividendProvider
      .fetchAssetDividends(assetTicker, maximumRecords)
      .then((freshDividends) => {
        if (freshDividends.length > 0) {
          this.cacheService.set(
            cacheKey,
            freshDividends.map((item) => item.toJSON()),
            environment.B3_CACHE_TTL_MS
          );
        }
      })
      .catch(() => {});
  }
}
