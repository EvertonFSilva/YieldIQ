import { RetrieveAssetPriceUseCase } from './RetrieveAssetPriceUseCase';
import { RetrieveAssetDividendsUseCase } from './RetrieveAssetDividendsUseCase';
import { Ticker } from '../../domain/value-objects/Ticker';

export interface AssetSummaryData {
  tickerSymbol: string;
  assetDescription: string | null;
  currentPrice: number;
  previousClosePrice: number;
  dailyVariationPercentage: number;
  latestDividendAnnouncement: {
    dividendValue: number;
    baseRecordDate: string;
    paymentDistributionDate: string;
    yieldOnCurrentPricePercentage: number;
  } | null;
  trailingAnnualDividendYieldPercentage: number;
  averageMonthlyDividendAmount: number;
  bazinCeilingPrice: number;
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
        yieldOnCurrentPricePercentage: Math.round(firstDividend.calculateYieldOnCurrentPrice(numericPrice) * 100) / 100
      };
    }

    const twelveMonthsDividendsTotal = dividendList.reduce(
      (accumulator, dividendItem) => accumulator + dividendItem.value.getAmount(),
      0
    );

    const averageMonthlyDividend = dividendList.length > 0 
      ? (twelveMonthsDividendsTotal / dividendList.length) 
      : 0;

    const annualDividendYield = numericPrice > 0 
      ? (twelveMonthsDividendsTotal / numericPrice) * 100 
      : 0;

    const bazinCeilingPriceCalculated = twelveMonthsDividendsTotal > 0 
      ? (twelveMonthsDividendsTotal / 0.06) 
      : 0;

    return {
      tickerSymbol: assetTicker.getSymbol(),
      assetDescription: priceQuote.assetDescription,
      currentPrice: numericPrice,
      previousClosePrice: priceQuote.previousClose.getAmount(),
      dailyVariationPercentage: Math.round(priceQuote.calculateDailyVariationPercentage() * 100) / 100,
      latestDividendAnnouncement: latestDividendData,
      trailingAnnualDividendYieldPercentage: Math.round(annualDividendYield * 100) / 100,
      averageMonthlyDividendAmount: Math.round(averageMonthlyDividend * 100) / 100,
      bazinCeilingPrice: Math.round(bazinCeilingPriceCalculated * 100) / 100,
      lastUpdatedAt: new Date().toISOString()
    };
  }
}
