import { IAssetRepository } from '../../domain/ports/IAssetRepository';
import { ICacheService } from '../../domain/ports/ICacheService';
import { Asset } from '../../domain/entities/Asset';
import { AssetType } from '../../domain/enums/AssetType';

export class ListAssetsUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(assetTypeFilter?: string): Promise<Asset[]> {
    const normalizedType = assetTypeFilter
      ? (assetTypeFilter.toUpperCase() as AssetType)
      : undefined;

    const cacheKey = `assets:list:${normalizedType || 'all'}`;

    const cachedData = await this.cacheService.get<any[]>(cacheKey);
    if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
      return cachedData.map((assetItem) => new Asset(assetItem));
    }

    const assets = await this.assetRepository.listAssetsByType(normalizedType);

    if (assets.length > 0) {
      await this.cacheService.set(
        cacheKey,
        assets.map((assetItem) => assetItem.toJSON()),
        15 * 60 * 1000
      );
    }

    return assets;
  }
}
