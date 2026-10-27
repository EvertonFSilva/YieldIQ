import { Dividend } from '../entities/Dividend';
import { Ticker } from '../value-objects/Ticker';
import { ExternalProvider } from '../enums/ExternalProvider';

export interface IDividendProvider {
  fetchAssetDividends(
    ticker: Ticker | string,
    maximumRecords?: number,
    providerSource?: ExternalProvider
  ): Promise<Dividend[]>;
}
