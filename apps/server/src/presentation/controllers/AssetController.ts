import { Request, Response, NextFunction } from 'express';
import { RetrieveAssetPriceUseCase } from '../../application/usecases/RetrieveAssetPriceUseCase';
import { RetrieveAssetDividendsUseCase } from '../../application/usecases/RetrieveAssetDividendsUseCase';
import { RetrieveAssetDocumentsUseCase } from '../../application/usecases/RetrieveAssetDocumentsUseCase';
import { RetrieveAssetSummaryUseCase } from '../../application/usecases/RetrieveAssetSummaryUseCase';
import { ListAssetsUseCase } from '../../application/usecases/ListAssetsUseCase';
import { yahooPriceProvider } from '../../infrastructure/scrapers/YahooPriceProvider';
import { b3DividendProvider } from '../../infrastructure/scrapers/B3DividendProvider';
import { fnetDocumentProvider } from '../../infrastructure/scrapers/FnetDocumentProvider';
import { assetRepository } from '../../infrastructure/repositories/SupabaseAssetRepository';
import { cacheService } from '../../infrastructure/cache/CacheService';

export class AssetController {
  private readonly retrieveAssetPriceUseCase = new RetrieveAssetPriceUseCase(yahooPriceProvider, cacheService);
  private readonly retrieveAssetDividendsUseCase = new RetrieveAssetDividendsUseCase(b3DividendProvider, cacheService);
  private readonly retrieveAssetDocumentsUseCase = new RetrieveAssetDocumentsUseCase(fnetDocumentProvider, cacheService);
  private readonly retrieveAssetSummaryUseCase = new RetrieveAssetSummaryUseCase(
    this.retrieveAssetPriceUseCase,
    this.retrieveAssetDividendsUseCase
  );
  private readonly listAssetsUseCase = new ListAssetsUseCase(assetRepository, cacheService);

  public listAssets = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const assetTypeFilter = request.query.type as string | undefined;
      const assets = await this.listAssetsUseCase.execute(assetTypeFilter);
      response.json({
        success: true,
        data: assets.map((assetItem) => assetItem.toJSON())
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrievePrice = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const { ticker } = request.params;
      const timeRange = (request.query.range as string) || '1d';
      const dataInterval = (request.query.interval as string) || '1d';

      const priceQuote = await this.retrieveAssetPriceUseCase.execute(ticker, timeRange, dataInterval);
      response.json({ success: true, data: priceQuote.toJSON() });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveDividends = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const { ticker } = request.params;
      const maximumRecords = parseInt(request.query.limit as string, 10) || 12;

      const dividends = await this.retrieveAssetDividendsUseCase.execute(ticker, maximumRecords);
      response.json({ success: true, data: dividends.map((dividendItem) => dividendItem.toJSON()) });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveDocuments = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const { ticker } = request.params;
      const documentCategoryName = (request.query.category as string) || 'all';
      const maximumRecords = parseInt(request.query.limit as string, 10) || 10;

      const documents = await this.retrieveAssetDocumentsUseCase.execute(
        ticker,
        documentCategoryName,
        maximumRecords
      );
      response.json({ success: true, data: documents.map((documentItem) => documentItem.toJSON()) });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveSummary = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const { ticker } = request.params;
      const summaryData = await this.retrieveAssetSummaryUseCase.execute(ticker);
      response.json({ success: true, data: summaryData });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const assetController = new AssetController();
