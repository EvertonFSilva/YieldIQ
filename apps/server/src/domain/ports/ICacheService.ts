export interface StaleCacheResult<T> {
  value: T;
  isStale: boolean;
}

export interface ICacheService {
  get<T>(cacheKey: string): Promise<T | null>;
  set<T>(cacheKey: string, cacheValue: T, timeToLiveMilliseconds?: number): Promise<void>;
  delete(cacheKey: string): Promise<void>;
  clear(searchPattern?: string): Promise<void>;
  getStale<T>(cacheKey: string): Promise<StaleCacheResult<T> | null>;
  getOrCompute<T>(
    cacheKey: string,
    computeFunction: () => Promise<T>,
    timeToLiveMilliseconds?: number
  ): Promise<T>;
}
