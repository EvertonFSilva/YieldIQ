import { Money } from '../value-objects/Money';

export interface TreasuryBondProperties {
  bondKey: string;
  bondName: string;
  indexerName?: string | null;
  profitabilityRate: number;
  profitabilityRateRaw: string;
  unitPrice?: number | null;
  minimumInvestmentAmount?: number | null;
  maturityFormattedDate?: string | null;
}

export class TreasuryBond {
  public readonly bondKey: string;
  public readonly bondName: string;
  public readonly indexerName: string | null;
  public readonly profitabilityRate: number;
  public readonly profitabilityRateRaw: string;
  public readonly unitPrice: Money | null;
  public readonly minimumInvestmentAmount: Money | null;
  public readonly maturityFormattedDate: string | null;

  constructor(properties: TreasuryBondProperties) {
    this.bondKey = properties.bondKey;
    this.bondName = properties.bondName;
    this.indexerName = properties.indexerName || null;
    this.profitabilityRate = properties.profitabilityRate;
    this.profitabilityRateRaw = properties.profitabilityRateRaw;
    this.unitPrice = properties.unitPrice != null ? new Money(properties.unitPrice) : null;
    this.minimumInvestmentAmount = properties.minimumInvestmentAmount != null ? new Money(properties.minimumInvestmentAmount) : null;
    this.maturityFormattedDate = properties.maturityFormattedDate || null;
  }

  public toJSON() {
    return {
      bondKey: this.bondKey,
      bondName: this.bondName,
      indexerName: this.indexerName,
      profitabilityRate: this.profitabilityRate,
      profitabilityRateRaw: this.profitabilityRateRaw,
      unitPrice: this.unitPrice ? this.unitPrice.getAmount() : null,
      minimumInvestmentAmount: this.minimumInvestmentAmount ? this.minimumInvestmentAmount.getAmount() : null,
      maturityFormattedDate: this.maturityFormattedDate
    };
  }
}
