import { PriceQuote } from '../entities/PriceQuote';
import { Ticker } from '../value-objects/Ticker';

export interface IPriceProvider {
  fetchAssetPrice(ticker: Ticker | string, timeRange?: string, dataInterval?: string): Promise<PriceQuote>;
}
