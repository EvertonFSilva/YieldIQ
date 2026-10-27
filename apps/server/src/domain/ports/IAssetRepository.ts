import { Asset } from '../entities/Asset';
import { AssetType } from '../enums/AssetType';
import { Ticker } from '../value-objects/Ticker';

export interface IAssetRepository {
  findAssetByTicker(ticker: Ticker | string): Promise<Asset | null>;
  listAssetsByType(assetType?: AssetType): Promise<Asset[]>;
  saveAsset(asset: Asset): Promise<void>;
  saveAssetBatch(assets: Asset[]): Promise<void>;
}
