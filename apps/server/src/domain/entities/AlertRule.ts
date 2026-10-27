import { AlertChannel, AlertTargetType } from '../enums/AlertType';
import { Money } from '../value-objects/Money';

export interface AlertRuleSettings {
  variationStepPercent?: number | null;
  minimumTargetPrice?: number | null;
  maximumTargetPrice?: number | null;
  targetDividendYield?: number | null;
  isPriceAlertEnabled?: boolean;
  isDividendAlertEnabled?: boolean;
  isMaterialFactAlertEnabled?: boolean;
  isReportAlertEnabled?: boolean;
  [key: string]: any;
}

export interface AlertRuleProperties {
  id: string;
  userId?: string | null;
  channelType: AlertChannel;
  destination: string;
  targetType: AlertTargetType;
  targetSymbol: string;
  settings?: AlertRuleSettings;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AlertRule {
  public readonly id: string;
  public readonly userId: string | null;
  public readonly channelType: AlertChannel;
  public readonly destination: string;
  public readonly targetType: AlertTargetType;
  public readonly targetSymbol: string;
  public readonly settings: AlertRuleSettings;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(properties: AlertRuleProperties) {
    this.id = properties.id;
    this.userId = properties.userId || null;
    this.channelType = properties.channelType;
    this.destination = properties.destination;
    this.targetType = properties.targetType;
    this.targetSymbol = properties.targetSymbol;
    this.settings = properties.settings || {};
    this.isActive = properties.isActive !== false;
    this.createdAt = properties.createdAt || new Date();
    this.updatedAt = properties.updatedAt || new Date();
  }

  public get minimumTargetPrice(): Money | null {
    return this.settings.minimumTargetPrice != null ? new Money(this.settings.minimumTargetPrice) : null;
  }

  public get maximumTargetPrice(): Money | null {
    return this.settings.maximumTargetPrice != null ? new Money(this.settings.maximumTargetPrice) : null;
  }

  public get variationPercentageThreshold(): number | null {
    return this.settings.variationStepPercent != null ? this.settings.variationStepPercent : null;
  }

  public get isPriceAlertEnabled(): boolean {
    return this.settings.isPriceAlertEnabled !== false;
  }

  public get isDividendAlertEnabled(): boolean {
    return this.settings.isDividendAlertEnabled !== false;
  }

  public get isMaterialFactAlertEnabled(): boolean {
    return this.settings.isMaterialFactAlertEnabled !== false;
  }

  public get isReportAlertEnabled(): boolean {
    return this.settings.isReportAlertEnabled !== false;
  }

  public toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      channelType: this.channelType,
      destination: this.destination,
      targetType: this.targetType,
      targetSymbol: this.targetSymbol,
      settings: this.settings,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
