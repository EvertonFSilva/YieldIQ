import { RetrieveAssetPriceUseCase } from './RetrieveAssetPriceUseCase';
import { RetrieveAssetDividendsUseCase } from './RetrieveAssetDividendsUseCase';
import { Ticker } from '../../domain/value-objects/Ticker';

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
}

export class RetrieveAssetSummaryUseCase {
  constructor(
    private readonly retrieveAssetPriceUseCase: RetrieveAssetPriceUseCase,
    private readonly retrieveAssetDividendsUseCase: RetrieveAssetDividendsUseCase
  ) {}

  public async execute(tickerSymbol: string): Promise<AssetSummaryData> {
    const assetTicker = new Ticker(tickerSymbol);

    const [priceQuote, dividendList] = await Promise.all([
      this.retrieveAssetPriceUseCase.execute(assetTicker.getSymbol()),
      this.retrieveAssetDividendsUseCase.execute(assetTicker.getSymbol(), 12)
    ]);

    const numericPrice = priceQuote.currentPrice.getAmount();

    let latestDividendData = null;
    if (dividendList.length > 0) {
      const firstDividend = dividendList[0];
      latestDividendData = {
        dividendValue: firstDividend.value.getAmount(),
        baseRecordDate: firstDividend.baseRecordDate,
        paymentDistributionDate: firstDividend.paymentDistributionDate,
        yieldOnCurrentPricePercentage:
          Math.round(firstDividend.calculateYieldOnCurrentPrice(numericPrice) * 100) / 100
      };
    }

    const twelveMonthsDividendsTotal = dividendList.reduce(
      (accumulator, dividendItem) => accumulator + dividendItem.value.getAmount(),
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

    const dailyVariation =
      Math.round(priceQuote.calculateDailyVariationPercentage() * 100) / 100;

    const quoteJson = priceQuote.toJSON();
    const priceQuoteStructured = {
      ...quoteJson,
      dailyVariationPercentage: dailyVariation,
      lastUpdatedAt: new Date().toISOString()
    };

    return {
      ticker: assetTicker.getSymbol(),
      tickerSymbol: assetTicker.getSymbol(),
      assetDescription: priceQuote.assetDescription || assetTicker.getSymbol(),
      priceQuote: priceQuoteStructured,
      currentPrice: numericPrice,
      previousClosePrice: priceQuote.previousClose.getAmount(),
      dailyVariationPercentage: dailyVariation,
      recentDividends: dividendList.map((d) => d.toJSON()),
      latestDividendAnnouncement: latestDividendData,
      annualDividendSum: Math.round(twelveMonthsDividendsTotal * 100) / 100,
      trailingDividendYieldPercentage: Math.round(annualDividendYield * 100) / 100,
      averageMonthlyDividendAmount: Math.round(averageMonthlyDividend * 100) / 100,
      bazinCeilingPriceSixPercent: Math.round(bazinCeilingPriceCalculated * 100) / 100,
      bazinCeilingPrice: Math.round(bazinCeilingPriceCalculated * 100) / 100,
      gordonCeilingPrice: Math.round(gordonCeilingPriceCalculated * 100) / 100,
      lastUpdatedAt: new Date().toISOString()
    };
  }
}