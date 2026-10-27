import { Money } from '../value-objects/Money';

export interface DividendProperties {
  dividendValue: number | string;
  baseRecordDate: string;
  paymentDistributionDate: string;
  documentSourceUrl?: string | null;
  ratePerShare?: number | null;
}

export class Dividend {
  public readonly value: Money;
  public readonly baseRecordDate: string;
  public readonly paymentDistributionDate: string;
  public readonly documentSourceUrl: string | null;

  constructor(properties: DividendProperties) {
    const parsedAmount = typeof properties.dividendValue === 'string'
      ? parseFloat(properties.dividendValue.replace(',', '.'))
      : properties.dividendValue;

    this.value = new Money(parsedAmount || 0);
    this.baseRecordDate = properties.baseRecordDate || '';
    this.paymentDistributionDate = properties.paymentDistributionDate || '';
    this.documentSourceUrl = properties.documentSourceUrl || null;
  }

  public calculateYieldOnCurrentPrice(currentAssetPrice: Money | number): number {
    const priceAmount = currentAssetPrice instanceof Money ? currentAssetPrice.getAmount() : currentAssetPrice;
    if (priceAmount <= 0 || this.value.getAmount() <= 0) {
      return 0;
    }
    return (this.value.getAmount() / priceAmount) * 100;
  }

  public toJSON() {
    return {
      dividendValue: this.value.getAmount(),
      formattedValue: this.value.formatBrazilianReal(),
      baseRecordDate: this.baseRecordDate,
      paymentDistributionDate: this.paymentDistributionDate,
      documentSourceUrl: this.documentSourceUrl
    };
  }
}
