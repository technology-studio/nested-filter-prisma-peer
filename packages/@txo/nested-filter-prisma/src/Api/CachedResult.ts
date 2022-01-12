/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2022-01-12T18:01:88+01:00
 * @Copyright: Technology Studio
**/

import type { CacheKey, Type } from '../Model/Types'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
let cache: Record<Type, Record<string, unknown>> = {} as Record<Type, Record<string, unknown>>

type Key = string | number | null

export const isResultCached = (type: Type, key: Key): boolean => (
  String(key) in (cache[type] ?? {})
)

export const getCachedResult = <VALUE>(type: Type, key: CacheKey): VALUE => (
  (cache[type] ?? {})[String(key)] as VALUE
)

export const addResultToCache = <VALUE>(type: Type, key: Key, value: VALUE): void => {
  if (!(type in cache)) {
    cache[type] = {}
  }
  cache[type][String(key)] = value
}

export const destroyResultCache = (): void => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  cache = {} as Record<Type, Record<string, unknown>>
}
