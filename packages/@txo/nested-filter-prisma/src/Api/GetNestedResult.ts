/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2022-05-08T14:05:85+02:00
 * @Copyright: Technology Studio
**/

import type {
  CacheKey,
  GetNestedResultAttributes,
  GetStructure,
  NestedArgMap, Type,
} from '../Model/Types'
import type { Context } from '@txo/prisma-graphql'

export const getNestedResultFactory = (
  resolverContext: Context,
  nestedArgMap: NestedArgMap,
) => async <TYPE extends Type, EXTRA_TYPE = unknown> ({
  type, onGet, cacheKey, cacheKeyAttribute = 'id', addNestedResult = false,
}: GetNestedResultAttributes<TYPE>): Promise<unknown extends EXTRA_TYPE ? GetStructure<TYPE> : (GetStructure<TYPE> | EXTRA_TYPE)> => {
  if (type in nestedArgMap) {
    return nestedArgMap[type]
  }

  if (onGet) {
    let result
    if (cacheKey !== undefined && resolverContext.resultCache.isResultCached(type, cacheKey)) {
      result = resolverContext.resultCache.getCachedResult(type, cacheKey)
    } else {
      result = await onGet()
      if (cacheKey === undefined && typeof result !== 'object') {
        throw new Error(`Non object nested result for (${type}) can not be cached without cache key`)
      }
      const key = cacheKey === undefined ? (result as Record<string, CacheKey>)[cacheKeyAttribute] : cacheKey
      resolverContext.resultCache.addResultToCache(type, key, result)
    }
    if (addNestedResult) {
      resolverContext.addNestedResult({ type, result })
    }
    return result
  }
  throw new Error(`Nested result for (${type}) is not present.`)
}
