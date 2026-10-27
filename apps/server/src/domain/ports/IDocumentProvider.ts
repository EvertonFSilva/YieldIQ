import { AssetDocument } from '../entities/AssetDocument';
import { Ticker } from '../value-objects/Ticker';

export interface IDocumentProvider {
  fetchAssetDocuments(
    ticker: Ticker | string,
    documentCategory?: string,
    maximumRecords?: number
  ): Promise<AssetDocument[]>;

  parseDividendAnnouncementXml(
    documentIdentifier: number,
    targetTickerSymbol?: string
  ): Promise<{ dividendAmount: string; baseRecordDate: string; paymentDistributionDate: string } | null>;

  parseSubscriptionXml(
    documentIdentifier: number
  ): Promise<{
    subscriptionPrice: number | null;
    subscriptionPercentage: number | null;
    issueNumber: number | null;
    totalAmount: number | null;
    periodStart: string | null;
    periodEnd: string | null;
    settlementDate: string | null;
    cutoffDate: string | null;
    canSellRights: boolean | null;
    hasLeftovers: boolean | null;
  } | null>;
}
