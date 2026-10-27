export interface AssetItem {
  id: string;
  ticker: string;
  name: string;
  type: 'FII' | 'FIAGRO' | 'FI_INFRA';
  metadata?: Record<string, any>;
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
  rateDescription?: string;
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
  notifyPublicOffering?: boolean;
  alertGordonPrice?: boolean;
  alertTargetYield?: number | null;
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
  role?: string;
  privilege: string;
  alertQuota?: number;
  ruleLimit: number;
}

export interface WhatsAppStatusData {
  isConnected: boolean;
  isConnecting: boolean;
  qrCodeDataUrl: string | null;
  phoneNumber: string | null;
  pushName: string | null;
}

export interface WhatsAppGroupItem {
  id: string;
  name: string;
}

export interface GroupAlertItem {
  id: string;
  group_name: string;
  ticker: string;
  alert_variation_pct: number | null;
  is_notify_dividend: boolean;
  is_notify_material_fact: boolean;
  is_notify_report: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  phone_number: string | null;
  role: string;
  alert_quota: number;
  created_at: string;
}

export interface AuthSession {
  user: UserAccountProfile;
  accessToken: string;
  apiKey: string | null;
}
