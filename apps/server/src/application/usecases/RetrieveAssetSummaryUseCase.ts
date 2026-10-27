import { RetrieveAssetPriceUseCase } from './RetrieveAssetPriceUseCase';
import { RetrieveAssetDividendsUseCase } from './RetrieveAssetDividendsUseCase';
import { Ticker } from '../../domain/value-objects/Ticker';
import { PriceQuote } from '../../domain/entities/PriceQuote';
import { Dividend } from '../../domain/entities/Dividend';
import { fnetDocumentProvider, ResolvedAssetDetails } from '../../infrastructure/scrapers/FnetDocumentProvider';

export interface AssetSummaryData {
  ticker: string;
  tickerSymbol: string;
  assetDescription: string | null;
  priceQuote: {
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
    dailyVariationPercentage: number;
  };
  currentPrice: number;
  previousClosePrice: number;
  dailyVariationPercentage: number;
  recentDividends: Array<{
    dividendValue: number;
    formattedValue: string;
    baseRecordDate: string;
    paymentDistributionDate: string;
    documentSourceUrl: string | null;
  }>;
  latestDividendAnnouncement: {
    dividendValue: number;
    baseRecordDate: string;
    paymentDistributionDate: string;
    yieldOnCurrentPricePercentage: number;
  } | null;
  annualDividendSum: number;
  trailingDividendYieldPercentage: number;
  averageMonthlyDividendAmount: number;
  bazinCeilingPriceSixPercent: number;
  bazinCeilingPrice: number;
  gordonCeilingPrice: number;
  lastUpdatedAt: string;
  institutionalDetails?: ResolvedAssetDetails | null;
}

export class RetrieveAssetSummaryUseCase {
  constructor(
    private readonly retrieveAssetPriceUseCase: RetrieveAssetPriceUseCase,
    private readonly retrieveAssetDividendsUseCase: RetrieveAssetDividendsUseCase
  ) {}

  public async execute(tickerSymbol: string): Promise<AssetSummaryData> {
    const cleanSymbol = (tickerSymbol || '').trim().toUpperCase();
    const assetTicker = new Ticker(cleanSymbol);

    let priceQuote: PriceQuote;
    try {
      priceQuote = await this.retrieveAssetPriceUseCase.execute(assetTicker.getSymbol());
    } catch {
      priceQuote = new PriceQuote({
        currentPrice: 0,
        previousClose: 0,
        assetDescription: assetTicker.getSymbol()
      });
    }

    let dividendList: Dividend[] = [];
    try {
      dividendList = await this.retrieveAssetDividendsUseCase.execute(assetTicker.getSymbol(), 12);
    } catch {
      dividendList = [];
    }

    let institutionalDetails: ResolvedAssetDetails | null = null;
    try {
      institutionalDetails = await fnetDocumentProvider.resolveAssetDetails(assetTicker.getSymbol());
    } catch {
      institutionalDetails = null;
    }

    const numericPrice = priceQuote?.currentPrice?.getAmount
      ? priceQuote.currentPrice.getAmount()
      : 0;

    let latestDividendData = null;
    if (dividendList && dividendList.length > 0) {
      const firstDividend = dividendList[0];
      const dividendAmount = firstDividend.value?.getAmount ? firstDividend.value.getAmount() : 0;
      latestDividendData = {
        dividendValue: dividendAmount,
        baseRecordDate: firstDividend.baseRecordDate || '',
        paymentDistributionDate: firstDividend.paymentDistributionDate || '',
        yieldOnCurrentPricePercentage:
          numericPrice > 0 ? Math.round((dividendAmount / numericPrice) * 10000) / 100 : 0
      };
    }

    const twelveMonthsDividendsTotal = (dividendList || []).reduce(
      (accumulator, dividendItem) =>
        accumulator + (dividendItem.value?.getAmount ? dividendItem.value.getAmount() : 0),
      0
    );

    const averageMonthlyDividend =
      dividendList.length > 0 ? twelveMonthsDividendsTotal / dividendList.length : 0;

    const annualDividendYield =
      numericPrice > 0 ? (twelveMonthsDividendsTotal / numericPrice) * 100 : 0;

    const bazinCeilingPriceCalculated =
      twelveMonthsDividendsTotal > 0 ? twelveMonthsDividendsTotal / 0.06 : 0;

    const gordonCeilingPriceCalculated =
      twelveMonthsDividendsTotal > 0 ? twelveMonthsDividendsTotal / 0.08 : 0;

    let dailyVariation = 0;
    try {
      dailyVariation =
        Math.round(priceQuote.calculateDailyVariationPercentage() * 100) / 100;
    } catch {
      dailyVariation = 0;
    }

    const quoteJson = priceQuote.toJSON ? priceQuote.toJSON() : {
      currentPrice: numericPrice,
      previousClose: 0,
      openingPrice: null,
      dayHighPrice: null,
      dayLowPrice: null,
      tradingVolume: 0,
      fiftyTwoWeekHighPrice: null,
      fiftyTwoWeekLowPrice: null,
      trailingAnnualDividendYield: null,
      dailyVariationPercentage: 0,
      assetDescription: assetTicker.getSymbol(),
      lastUpdatedAt: new Date().toISOString()
    };

    const priceQuoteStructured = {
      ...quoteJson,
      dailyVariationPercentage: dailyVariation,
      lastUpdatedAt: new Date().toISOString()
    };

    const previousCloseAmount = priceQuote?.previousClose?.getAmount
      ? priceQuote.previousClose.getAmount()
      : 0;

    return {
      ticker: assetTicker.getSymbol(),
      tickerSymbol: assetTicker.getSymbol(),
      assetDescription:
        institutionalDetails?.fundName ||
        priceQuote.assetDescription ||
        assetTicker.getSymbol(),
      priceQuote: priceQuoteStructured,
      currentPrice: numericPrice,
      previousClosePrice: previousCloseAmount,
      dailyVariationPercentage: dailyVariation,
      recentDividends: (dividendList || []).map((d) => (d.toJSON ? d.toJSON() : {
        dividendValue: 0,
        formattedValue: 'R$ 0,00',
        baseRecordDate: '',
        paymentDistributionDate: '',
        documentSourceUrl: null
      })),
      latestDividendAnnouncement: latestDividendData,
      annualDividendSum: Math.round(twelveMonthsDividendsTotal * 100) / 100,
      trailingDividendYieldPercentage: Math.round(annualDividendYield * 100) / 100,
      averageMonthlyDividendAmount: Math.round(averageMonthlyDividend * 100) / 100,
      bazinCeilingPriceSixPercent: Math.round(bazinCeilingPriceCalculated * 100) / 100,
      bazinCeilingPrice: Math.round(bazinCeilingPriceCalculated * 100) / 100,
      gordonCeilingPrice: Math.round(gordonCeilingPriceCalculated * 100) / 100,
      lastUpdatedAt: new Date().toISOString(),
      institutionalDetails
    };
  }
}
