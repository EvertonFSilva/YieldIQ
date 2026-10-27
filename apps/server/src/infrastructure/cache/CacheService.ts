import { ICacheService, StaleCacheResult } from '../../domain/ports/ICacheService';

interface CacheStorageRecord<T> {
  value: T;
  expirationTimestamp: number;
}

export class CacheService implements ICacheService {
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

    return null;
  }

  public async getStale<T>(cacheKey: string): Promise<StaleCacheResult<T> | null> {
    const storedRecord = this.memoryStorage.get(cacheKey);
    if (!storedRecord) {
      return null;
    }

    const currentTimestamp = Date.now();
    const isStale = storedRecord.expirationTimestamp <= currentTimestamp;
    this.refreshAccessOrder(cacheKey, storedRecord);

    return {
      value: storedRecord.value as T,
      isStale
    };
  }

  public async set<T>(
    cacheKey: string,
    value: T,
    timeToLiveMilliseconds?: number
  ): Promise<void> {
    const ttl = timeToLiveMilliseconds ?? this.defaultTimeToLiveMilliseconds;
    const expirationTimestamp = Date.now() + ttl;

    this.ensureStorageCapacity();

    this.memoryStorage.set(cacheKey, {
      value,
      expirationTimestamp
    });
  }

  public async delete(cacheKey: string): Promise<void> {
    this.memoryStorage.delete(cacheKey);
  }

  public async getOrSet<T>(
    cacheKey: string,
    computationFactory: () => Promise<T>,
    timeToLiveMilliseconds?: number
  ): Promise<T> {
    const cachedValue = await this.get<T>(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const existingComputation = this.inFlightComputations.get(cacheKey);
    if (existingComputation) {
      return existingComputation as Promise<T>;
    }

    const computationPromise = computationFactory()
      .then(async (computedResult) => {
        await this.set(cacheKey, computedResult, timeToLiveMilliseconds);
        return computedResult;
      })
      .finally(() => {
        this.inFlightComputations.delete(cacheKey);
      });

    this.inFlightComputations.set(cacheKey, computationPromise);

    return computationPromise;
  }

  public async invalidateByPrefix(cacheKeyPrefix: string): Promise<number> {
    let invalidatedCount = 0;
    for (const key of this.memoryStorage.keys()) {
      if (key.startsWith(cacheKeyPrefix)) {
        this.memoryStorage.delete(key);
        invalidatedCount++;
      }
    }
    return invalidatedCount;
  }

  public async clear(): Promise<void> {
    this.memoryStorage.clear();
    this.inFlightComputations.clear();
  }

  public getCacheMetrics(): { totalEntries: number; inFlightComputations: number } {
    return {
      totalEntries: this.memoryStorage.size,
      inFlightComputations: this.inFlightComputations.size
    };
  }

  private refreshAccessOrder(cacheKey: string, record: CacheStorageRecord<any>): void {
    this.memoryStorage.delete(cacheKey);
    this.memoryStorage.set(cacheKey, record);
  }

  private ensureStorageCapacity(): void {
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

export const cacheService = new CacheService();
