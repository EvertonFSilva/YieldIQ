import { Request, Response, NextFunction } from 'express';
import { RetrieveTreasuryBondsUseCase } from '../../application/usecases/RetrieveTreasuryBondsUseCase';
import { treasuryDirectProvider } from '../../infrastructure/scrapers/TreasuryDirectProvider';
import { cacheService } from '../../infrastructure/cache/CacheService';

export class TreasuryController {
  private readonly retrieveTreasuryBondsUseCase = new RetrieveTreasuryBondsUseCase(
    treasuryDirectProvider,
    cacheService
  );

  public retrieveBonds = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const treasuryBonds = await this.retrieveTreasuryBondsUseCase.execute();
      response.json({
        success: true,
        data: treasuryBonds.map((bondItem) => bondItem.toJSON())
      });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const treasuryController = new TreasuryController();
