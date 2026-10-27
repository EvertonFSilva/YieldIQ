import { Money } from '../value-objects/Money';

export interface PriceQuoteProperties {
  currentPrice: number;
  previousClose?: number | null;
  openingPrice?: number | null;
  dayHighPrice?: number | null;
  dayLowPrice?: number | null;
  tradingVolume?: number | null;
  fiftyTwoWeekHighPrice?: number | null;
  fiftyTwoWeekLowPrice?: number | null;
  trailingAnnualDividendYield?: number | null;
  assetDescription?: string | null;
  lastUpdatedAt?: Date | string | null;
}

export class PriceQuote {
  public readonly currentPrice: Money;
  public readonly previousClose: Money;
  public readonly openingPrice: Money | null;
  public readonly dayHighPrice: Money | null;
  public readonly dayLowPrice: Money | null;
  public readonly tradingVolume: number;
  public readonly fiftyTwoWeekHighPrice: Money | null;
  public readonly fiftyTwoWeekLowPrice: Money | null;
  public readonly trailingAnnualDividendYield: number | null;
  public readonly assetDescription: string | null;
  public readonly lastUpdatedAt: Date;

  constructor(properties: PriceQuoteProperties) {
    this.currentPrice = new Money(properties.currentPrice || 0);
    this.previousClose = new Money(properties.previousClose || 0);
    this.openingPrice = properties.openingPrice != null ? new Money(properties.openingPrice) : null;
    this.dayHighPrice = properties.dayHighPrice != null ? new Money(properties.dayHighPrice) : null;
    this.dayLowPrice = properties.dayLowPrice != null ? new Money(properties.dayLowPrice) : null;
    this.tradingVolume = properties.tradingVolume || 0;
    this.fiftyTwoWeekHighPrice = properties.fiftyTwoWeekHighPrice != null ? new Money(properties.fiftyTwoWeekHighPrice) : null;
    this.fiftyTwoWeekLowPrice = properties.fiftyTwoWeekLowPrice != null ? new Money(properties.fiftyTwoWeekLowPrice) : null;
    this.trailingAnnualDividendYield = properties.trailingAnnualDividendYield || null;
    this.assetDescription = properties.assetDescription || null;
    
    if (properties.lastUpdatedAt instanceof Date) {
      this.lastUpdatedAt = properties.lastUpdatedAt;
    } else if (typeof properties.lastUpdatedAt === 'string' && properties.lastUpdatedAt.length > 0) {
      const parsedDate = new Date(properties.lastUpdatedAt);
      this.lastUpdatedAt = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    } else {
      this.lastUpdatedAt = new Date();
    }
  }

  public calculateDailyVariationPercentage(): number {
    const basePrice = this.previousClose.getAmount() > 0 
      ? this.previousClose.getAmount() 
      : (this.openingPrice ? this.openingPrice.getAmount() : 0);

    if (basePrice <= 0 || this.currentPrice.getAmount() <= 0) {
      return 0;
    }
    return ((this.currentPrice.getAmount() - basePrice) / basePrice) * 100;
  }

  public toJSON() {
    const validDate = this.lastUpdatedAt instanceof Date ? this.lastUpdatedAt : new Date(this.lastUpdatedAt);
    return {
      currentPrice: this.currentPrice.getAmount(),
      previousClose: this.previousClose.getAmount(),
      openingPrice: this.openingPrice ? this.openingPrice.getAmount() : null,
      dayHighPrice: this.dayHighPrice ? this.dayHighPrice.getAmount() : null,
      dayLowPrice: this.dayLowPrice ? this.dayLowPrice.getAmount() : null,
      tradingVolume: this.tradingVolume,
      fiftyTwoWeekHighPrice: this.fiftyTwoWeekHighPrice ? this.fiftyTwoWeekHighPrice.getAmount() : null,
      fiftyTwoWeekLowPrice: this.fiftyTwoWeekLowPrice ? this.fiftyTwoWeekLowPrice.getAmount() : null,
      trailingAnnualDividendYield: this.trailingAnnualDividendYield,
      dailyVariationPercentage: Math.round(this.calculateDailyVariationPercentage() * 100) / 100,
      assetDescription: this.assetDescription,
      lastUpdatedAt: (isNaN(validDate.getTime()) ? new Date() : validDate).toISOString()
    };
  }
}
