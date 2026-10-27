export interface AssetItem {
  id: string;
  ticker: string;
  name: string;
  type: 'FII' | 'FIAGRO' | 'FI_INFRA';
  taxpayerRegistrationNumber?: string | null;
  administratorName?: string | null;
  managementCompanyName?: string | null;
}

export interface PriceQuoteData {
  currentPrice: number;
  previousClose: number;
  openingPrice: number | null;
  dayHighPrice: number | null;
  dayLowPrice: number | null;
  tradingVolume: number;
  fiftyTwoWeekHighPrice: number | null;
  fiftyTwoWeekLowPrice: number | null;
  assetDescription: string | null;
  lastUpdatedAt: string;
  dailyVariationPercentage?: number;
}

export interface DividendItem {
  dividendValue: number;
  formattedValue: string;
  baseRecordDate: string;
  paymentDistributionDate: string;
  documentSourceUrl: string | null;
}

export interface DocumentItem {
  documentIdentifier: number | string;
  referenceDate: string;
  documentDownloadUrl: string;
  documentDescription: string;
  documentCategoryName?: string;
  documentCategoryId?: number;
}

export interface AssetSummaryData {
  ticker: string;
  priceQuote: PriceQuoteData;
  recentDividends: DividendItem[];
  annualDividendSum: number;
  trailingDividendYieldPercentage: number;
  bazinCeilingPriceSixPercent: number;
  gordonCeilingPrice: number;
}

export interface TreasuryBondItem {
  bondKey: string;
  bondName: string;
  indexerName: string | null;
  profitabilityRate: number;
  profitabilityRateRaw: string;
  unitPrice: number | null;
  minimumInvestmentAmount: number | null;
  maturityFormattedDate: string | null;
}

export interface AlertRuleItem {
  id: string;
  ticker: string;
  alertPriceMin: number | null;
  alertPriceMax: number | null;
  alertPriceChangePct: number | null;
  notifyPrice: boolean;
  notifyDividend: boolean;
  notifyMaterialFact: boolean;
  notifyReport: boolean;
  notifyPublicOffering: boolean;
  alertGordonPrice: boolean;
  alertTargetYield: number | null;
  enabled: boolean;
  createdAt: string;
}

export interface UserAccountProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  apiKey: string;
  phoneNumber: string | null;
  isWhatsAppEnabled: boolean;
  privilege: string;
  ruleLimit: number;
}
