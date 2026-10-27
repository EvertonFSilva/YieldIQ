import { ICacheService, StaleCacheResult } from '../../domain/ports/ICacheService';

interface CacheStorageRecord<T> {
  value: T;
  expirationTimestamp: number;
}

export class RobustCacheService implements ICacheService {
  private readonly memoryStorage = new Map<string, CacheStorageRecord<any>>();
  private readonly inFlightComputations = new Map<string, Promise<any>>();
  private readonly maximumEntriesCount: number;
  private readonly defaultTimeToLiveMilliseconds: number;
  private periodicSweepTimer: NodeJS.Timeout | null = null;

  constructor(
    maximumEntriesCount: number = 3000,
    defaultTimeToLiveMilliseconds: number = 5 * 60 * 1000
  ) {
    this.maximumEntriesCount = maximumEntriesCount;
    this.defaultTimeToLiveMilliseconds = defaultTimeToLiveMilliseconds;
    this.startPeriodicExpirationSweep();
  }

  private startPeriodicExpirationSweep(): void {
    if (this.periodicSweepTimer) {
      clearInterval(this.periodicSweepTimer);
    }
    this.periodicSweepTimer = setInterval(() => {
      this.sweepExpiredEntries();
    }, 10 * 60 * 1000);
  }

  private sweepExpiredEntries(): void {
    const currentTimestamp = Date.now();
    for (const [key, record] of this.memoryStorage.entries()) {
      if (record.expirationTimestamp <= currentTimestamp) {
        this.memoryStorage.delete(key);
      }
    }
  }

  public async get<T>(cacheKey: string): Promise<T | null> {
    const currentTimestamp = Date.now();
    const storedRecord = this.memoryStorage.get(cacheKey);

    if (storedRecord && storedRecord.expirationTimestamp > currentTimestamp) {
      this.refreshAccessOrder(cacheKey, storedRecord);
      return storedRecord.value as T;
    }

    if (storedRecord) {
      this.memoryStorage.delete(cacheKey);
    }

    return null;
  }

  public async set<T>(
    cacheKey: string,
    cacheValue: T,
    timeToLiveMilliseconds?: number
  ): Promise<void> {
    const duration = timeToLiveMilliseconds ?? this.defaultTimeToLiveMilliseconds;
    const expirationTimestamp = Date.now() + duration;

    this.enforceCapacityLimit();
    this.memoryStorage.set(cacheKey, { value: cacheValue, expirationTimestamp });
  }

  public async delete(cacheKey: string): Promise<void> {
    this.memoryStorage.delete(cacheKey);
    this.inFlightComputations.delete(cacheKey);
  }

  public async clear(searchPattern?: string): Promise<void> {
    if (searchPattern) {
      for (const storageKey of this.memoryStorage.keys()) {
        if (storageKey.includes(searchPattern)) {
          this.memoryStorage.delete(storageKey);
        }
      }
    } else {
      this.memoryStorage.clear();
      this.inFlightComputations.clear();
    }
  }

  public async getStale<T>(cacheKey: string): Promise<StaleCacheResult<T> | null> {
    const currentTimestamp = Date.now();
    const storedRecord = this.memoryStorage.get(cacheKey);

    if (storedRecord) {
      this.refreshAccessOrder(cacheKey, storedRecord);
      return {
        value: storedRecord.value as T,
        isStale: storedRecord.expirationTimestamp <= currentTimestamp
      };
    }

    return null;
  }

  public async getOrCompute<T>(
    cacheKey: string,
    computeFunction: () => Promise<T>,
    timeToLiveMilliseconds?: number
  ): Promise<T> {
    const cachedData = await this.get<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    const activeComputation = this.inFlightComputations.get(cacheKey);
    if (activeComputation) {
      return activeComputation as Promise<T>;
    }

    const computationPromise = computeFunction()
      .then(async (computedResult) => {
        if (computedResult !== null && computedResult !== undefined) {
          await this.set(cacheKey, computedResult, timeToLiveMilliseconds);
        }
        return computedResult;
      })
      .finally(() => {
        this.inFlightComputations.delete(cacheKey);
      });

    this.inFlightComputations.set(cacheKey, computationPromise);
    return computationPromise;
  }

  private refreshAccessOrder<T>(cacheKey: string, storedRecord: CacheStorageRecord<T>): void {
    this.memoryStorage.delete(cacheKey);
    this.memoryStorage.set(cacheKey, storedRecord);
  }

  private enforceCapacityLimit(): void {
    if (this.memoryStorage.size < this.maximumEntriesCount) {
      return;
    }

    this.sweepExpiredEntries();

    if (this.memoryStorage.size >= this.maximumEntriesCount) {
      const itemsToEvictCount = Math.max(1, Math.floor(this.maximumEntriesCount * 0.1));
      let evictedCount = 0;
      for (const oldestKey of this.memoryStorage.keys()) {
        this.memoryStorage.delete(oldestKey);
        evictedCount++;
        if (evictedCount >= itemsToEvictCount) {
          break;
        }
      }
    }
  }

  public destroy(): void {
    if (this.periodicSweepTimer) {
      clearInterval(this.periodicSweepTimer);
      this.periodicSweepTimer = null;
    }
    this.memoryStorage.clear();
    this.inFlightComputations.clear();
  }
}

export const cacheService = new RobustCacheService();
