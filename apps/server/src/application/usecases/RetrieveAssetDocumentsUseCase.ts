import { IDocumentProvider } from '../../domain/ports/IDocumentProvider';
import { ICacheService } from '../../domain/ports/ICacheService';
import { AssetDocument } from '../../domain/entities/AssetDocument';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment } from '../../config/env';

export class RetrieveAssetDocumentsUseCase {
  constructor(
    private readonly documentProvider: IDocumentProvider,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(
    tickerSymbol: string,
    documentCategoryName: string = 'all',
    maximumRecords: number = 10
  ): Promise<AssetDocument[]> {
    const assetTicker = new Ticker(tickerSymbol);
    const cacheKey = `documents:${assetTicker.getSymbol()}:${documentCategoryName}:${maximumRecords}`;

    const cachedRecords = await this.cacheService.get<any[]>(cacheKey);
    if (cachedRecords && Array.isArray(cachedRecords) && cachedRecords.length > 0) {
      return cachedRecords.map((item) => new AssetDocument(item));
    }

    const staleRecord = await this.cacheService.getStale<any[]>(cacheKey);
    if (staleRecord && Array.isArray(staleRecord.value) && staleRecord.value.length > 0) {
      this.revalidateDocumentsInBackground(cacheKey, assetTicker, documentCategoryName, maximumRecords);
      return staleRecord.value.map((item) => new AssetDocument(item));
    }

    const freshDocuments = await this.documentProvider.fetchAssetDocuments(
      assetTicker,
      documentCategoryName,
      maximumRecords
    );

    if (freshDocuments.length > 0) {
      await this.cacheService.set(
        cacheKey,
        freshDocuments.map((item) => item.toJSON()),
        environment.FNET_CACHE_TTL_MS
      );
    }

    return freshDocuments;
  }

  private revalidateDocumentsInBackground(
    cacheKey: string,
    assetTicker: Ticker,
    documentCategoryName: string,
    maximumRecords: number
  ): void {
    this.documentProvider
      .fetchAssetDocuments(assetTicker, documentCategoryName, maximumRecords)
      .then((freshDocuments) => {
        if (freshDocuments.length > 0) {
          this.cacheService.set(
            cacheKey,
            freshDocuments.map((item) => item.toJSON()),
            environment.FNET_CACHE_TTL_MS
          );
        }
      })
      .catch(() => {});
  }
}
