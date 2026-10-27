import { Money } from '../value-objects/Money';

export interface AlertRuleProperties {
  id: string;
  userId: string;
  assetId: string;
  tickerSymbol: string;
  targetGroupName?: string | null;
  minimumTargetPrice?: number | null;
  maximumTargetPrice?: number | null;
  variationPercentageThreshold?: number | null;
  targetDividendYield?: number | null;
  isPriceAlertEnabled?: boolean;
  isDividendAlertEnabled?: boolean;
  isMaterialFactAlertEnabled?: boolean;
  isReportAlertEnabled?: boolean;
  isPublicOfferingAlertEnabled?: boolean;
  isGordonPriceAlertEnabled?: boolean;
  isActive?: boolean;
  createdAt?: Date;
}

export class AlertRule {
  public readonly id: string;
  public readonly userId: string;
  public readonly assetId: string;
  public readonly tickerSymbol: string;
  public readonly targetGroupName: string | null;
  public readonly minimumTargetPrice: Money | null;
  public readonly maximumTargetPrice: Money | null;
  public readonly variationPercentageThreshold: number | null;
  public readonly targetDividendYield: number | null;
  public readonly isPriceAlertEnabled: boolean;
  public readonly isDividendAlertEnabled: boolean;
  public readonly isMaterialFactAlertEnabled: boolean;
  public readonly isReportAlertEnabled: boolean;
  public readonly isPublicOfferingAlertEnabled: boolean;
  public readonly isGordonPriceAlertEnabled: boolean;
  public readonly isActive: boolean;
  public readonly createdAt: Date;

  constructor(properties: AlertRuleProperties) {
    this.id = properties.id;
    this.userId = properties.userId;
    this.assetId = properties.assetId;
    this.tickerSymbol = properties.tickerSymbol;
    this.targetGroupName = properties.targetGroupName || null;
    this.minimumTargetPrice = properties.minimumTargetPrice != null ? new Money(properties.minimumTargetPrice) : null;
    this.maximumTargetPrice = properties.maximumTargetPrice != null ? new Money(properties.maximumTargetPrice) : null;
    this.variationPercentageThreshold = properties.variationPercentageThreshold != null ? properties.variationPercentageThreshold : null;
    this.targetDividendYield = properties.targetDividendYield != null ? properties.targetDividendYield : null;
    this.isPriceAlertEnabled = Boolean(properties.isPriceAlertEnabled);
    this.isDividendAlertEnabled = Boolean(properties.isDividendAlertEnabled);
    this.isMaterialFactAlertEnabled = Boolean(properties.isMaterialFactAlertEnabled);
    this.isReportAlertEnabled = Boolean(properties.isReportAlertEnabled);
    this.isPublicOfferingAlertEnabled = Boolean(properties.isPublicOfferingAlertEnabled);
    this.isGordonPriceAlertEnabled = Boolean(properties.isGordonPriceAlertEnabled);
    this.isActive = properties.isActive !== false;
    this.createdAt = properties.createdAt || new Date();
  }

  public isGroupAlertRule(): boolean {
    return this.userId === 'admin' && Boolean(this.targetGroupName);
  }

  public toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      assetId: this.assetId,
      tickerSymbol: this.tickerSymbol,
      targetGroupName: this.targetGroupName,
      minimumTargetPrice: this.minimumTargetPrice ? this.minimumTargetPrice.getAmount() : null,
      maximumTargetPrice: this.maximumTargetPrice ? this.maximumTargetPrice.getAmount() : null,
      variationPercentageThreshold: this.variationPercentageThreshold,
      targetDividendYield: this.targetDividendYield,
      isPriceAlertEnabled: this.isPriceAlertEnabled,
      isDividendAlertEnabled: this.isDividendAlertEnabled,
      isMaterialFactAlertEnabled: this.isMaterialFactAlertEnabled,
      isReportAlertEnabled: this.isReportAlertEnabled,
      isPublicOfferingAlertEnabled: this.isPublicOfferingAlertEnabled,
      isGordonPriceAlertEnabled: this.isGordonPriceAlertEnabled,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString()
    };
  }
}
