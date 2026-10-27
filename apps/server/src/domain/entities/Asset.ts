import { AssetType } from '../enums/AssetType';
import { Ticker } from '../value-objects/Ticker';

export interface AssetMetadata {
  taxId?: string | null;
  administrator?: string | null;
  manager?: string | null;
  segment?: string | null;
  mandate?: string | null;
  [key: string]: any;
}

export interface AssetProperties {
  id: string;
  ticker: string | Ticker;
  name: string;
  type: AssetType;
  metadata?: AssetMetadata;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Asset {
  public readonly id: string;
  public readonly ticker: Ticker;
  public readonly name: string;
  public readonly type: AssetType;
  public readonly metadata: AssetMetadata;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(properties: AssetProperties) {
    this.id = properties.id;
    this.ticker = properties.ticker instanceof Ticker ? properties.ticker : new Ticker(properties.ticker);
    this.name = properties.name;
    this.type = properties.type;
    this.metadata = properties.metadata || {};
    this.isActive = properties.isActive !== false;
    this.createdAt = properties.createdAt || new Date();
    this.updatedAt = properties.updatedAt || new Date();
  }

  public get taxpayerRegistrationNumber(): string | null {
    return this.metadata.taxId || null;
  }

  public get administratorName(): string | null {
    return this.metadata.administrator || null;
  }

  public get managementCompanyName(): string | null {
    return this.metadata.manager || null;
  }

  public toJSON() {
    return {
      id: this.id,
      ticker: this.ticker.getSymbol(),
      name: this.name,
      type: this.type,
      metadata: this.metadata,
      isActive: this.isActive,
      taxpayerRegistrationNumber: this.taxpayerRegistrationNumber,
      administratorName: this.administratorName,
      managementCompanyName: this.managementCompanyName
    };
  }
}
