/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2022-01-12T18:01:88+01:00
 * @Copyright: Technology Studio
**/

import type { CacheKey, Type, ResultCache } from '../Model/Types'

export class ResultCacheImpl implements ResultCache {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  _cache: Record<Type, Record<string, unknown>> = {} as Record<Type, Record<string, unknown>>

  resetCache (): void {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this._cache = {} as Record<Type, Record<string, unknown>>
  }

  isResultCached = (type: Type, key: CacheKey): boolean => (
    String(key) in (this._cache[type] ?? {})
  )

  getCachedResult = <VALUE>(type: Type, key: CacheKey): VALUE => (
    (this._cache[type] ?? {})[String(key)] as VALUE
  )

  addResultToCache = <VALUE>(type: Type, key: CacheKey, value: VALUE): void => {
    if (!(type in this._cache)) {
      this._cache[type] = {}
    }
    this._cache[type][String(key)] = value
  }
}
