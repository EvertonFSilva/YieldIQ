import { AssetType } from '../enums/AssetType';
import { Ticker } from '../value-objects/Ticker';

export interface AssetProperties {
  id: string;
  ticker: string | Ticker;
  name: string;
  type: AssetType;
  taxpayerRegistrationNumber?: string | null;
  administratorName?: string | null;
  managementCompanyName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Asset {
  public readonly id: string;
  public readonly ticker: Ticker;
  public readonly name: string;
  public readonly type: AssetType;
  public readonly taxpayerRegistrationNumber?: string | null;
  public readonly administratorName?: string | null;
  public readonly managementCompanyName?: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(properties: AssetProperties) {
    this.id = properties.id;
    this.ticker = properties.ticker instanceof Ticker ? properties.ticker : new Ticker(properties.ticker);
    this.name = properties.name;
    this.type = properties.type;
    this.taxpayerRegistrationNumber = properties.taxpayerRegistrationNumber || null;
    this.administratorName = properties.administratorName || null;
    this.managementCompanyName = properties.managementCompanyName || null;
    this.createdAt = properties.createdAt || new Date();
    this.updatedAt = properties.updatedAt || new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      ticker: this.ticker.getSymbol(),
      name: this.name,
      type: this.type,
      taxpayerRegistrationNumber: this.taxpayerRegistrationNumber,
      administratorName: this.administratorName,
      managementCompanyName: this.managementCompanyName
    };
  }
}
