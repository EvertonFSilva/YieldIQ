import { ITreasuryProvider } from '../../domain/ports/ITreasuryProvider';
import { ICacheService } from '../../domain/ports/ICacheService';
import { TreasuryBond } from '../../domain/entities/TreasuryBond';
import { environment } from '../../config/env';

export class RetrieveTreasuryBondsUseCase {
  constructor(
    private readonly treasuryProvider: ITreasuryProvider,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(): Promise<TreasuryBond[]> {
    const cacheKey = 'treasury:bonds';

    const cachedBonds = await this.cacheService.get<any[]>(cacheKey);
    if (cachedBonds && Array.isArray(cachedBonds) && cachedBonds.length > 0) {
      return cachedBonds.map((bondItem) => new TreasuryBond(bondItem));
    }

    const staleBonds = await this.cacheService.getStale<any[]>(cacheKey);
    if (staleBonds && Array.isArray(staleBonds.value) && staleBonds.value.length > 0) {
      this.revalidateBondsInBackground(cacheKey);
      return staleBonds.value.map((bondItem) => new TreasuryBond(bondItem));
    }

    const freshBonds = await this.treasuryProvider.fetchTreasuryBonds();
    if (freshBonds.length > 0) {
      await this.cacheService.set(
        cacheKey,
        freshBonds.map((bondItem) => bondItem.toJSON()),
        environment.TREASURY_CACHE_TTL_MS
      );
    }

    return freshBonds;
  }

  private revalidateBondsInBackground(cacheKey: string): void {
    this.treasuryProvider
      .fetchTreasuryBonds()
      .then((freshBonds) => {
        if (freshBonds.length > 0) {
          this.cacheService.set(
            cacheKey,
            freshBonds.map((bondItem) => bondItem.toJSON()),
            environment.TREASURY_CACHE_TTL_MS
          );
        }
      })
      .catch(() => {});
  }
}
