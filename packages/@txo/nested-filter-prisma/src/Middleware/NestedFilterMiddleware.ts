/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-02T08:05:60+02:00
 * @Copyright: Technology Studio
**/

import { GraphQLResolveInfo, isLeafType, getNamedType } from 'graphql'
import { Log } from '@txo/log'
import type { Context } from '@txo/prisma-graphql'

import { withNestedFilters } from '../Api/WithNestedFilters'
import type {
  GetWhere,
  MappingResultMap,
  NestedArgMap,
  NestedResultMap,
  NestedResultNode,
  Type,
  WithNestedFiltersAttributes,
} from '../Model/Types'
import { reportMissingNestedFilters, ResultCacheImpl } from '../Api'

const log = new Log('txo.nested-filter-prisma.Middleware.NestedFilterMiddleware')

const getPathList = (path: GraphQLResolveInfo['path']): string[] => [
  ...(path.prev ? getPathList(path.prev) : []),
  path.key.toString(),
]

const getOrCreateNode = (map: NestedResultMap, key: string): NestedResultNode => {
  const value = map[key]
  if (!value) {
    map[key] = { children: {}, nestedArgMap: {} }
  }
  return map[key]
}

const setNestedResultAndGetNestedArgMap = (
  nestedResultMap: NestedResultMap,
  pathList: string[],
  nestedArgMap: NestedArgMap,
  nestedResultNode?: NestedResultNode,
): NestedArgMap => {
  if (!pathList.length) {
    throw new Error('Empty path')
  }
  const [key, ...restPathList] = pathList

  log.debug('setNestedResultAndGetNestedArgMap', { key, restPathList, nestedResultMap, nestedArgMap, nestedResultNode })

  if (restPathList.length > 1) {
    const { type, result, children, nestedArgMap: nodeNestedArgMap } = getOrCreateNode(nestedResultMap, key)

    if (type && result) {
      nestedArgMap[type] = result
      for (const _type in nodeNestedArgMap) {
        nestedArgMap[_type as Type] = nodeNestedArgMap[_type as Type]
      }
    }
    return setNestedResultAndGetNestedArgMap(
      children,
      restPathList,
      nestedArgMap,
      nestedResultNode,
    )
  }

  if (nestedResultNode) {
    nestedResultMap[key] = nestedResultNode
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    nestedArgMap[nestedResultNode.type!] = nestedResultNode.result
  }

  log.debug('setNestedResultAndGetNestedArgMap final', { key, restPathList, nestedResultMap, nestedArgMap, nestedResultNode })
  return nestedArgMap
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syncContext = (context: any, resolverContext: any): void => {
  const ignoredKeyList = ['nestedArgMap', 'withNestedFilters']
  for (const key in resolverContext) {
    if (!ignoredKeyList.includes(key)) {
      context[key] = resolverContext[key]
    }
  }

  for (const key in context) {
    if (!(key in resolverContext)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete context[key]
    }
  }
}

const defaultMapResultType = (type: string): string => (
  type.replace(/Mutation$/, '')
)

export const nestedFilterMiddlewareFactory = ({
  ignoredTypeList = [],
  mapResultType = defaultMapResultType,
}: {
  ignoredTypeList?: string[],
  mapResultType?: (type: string) => string,
} = {}) => async <
SOURCE,
ARGS,
RESULT
>(
  resolve: (source: SOURCE, args: ARGS, context: Context, info: GraphQLResolveInfo) => Promise<RESULT>,
  source: SOURCE,
  args: ARGS,
  context: Context,
  info: GraphQLResolveInfo,
): Promise<RESULT> => {
  const pathList = getPathList(info.path)

  let nestedResultNode: NestedResultNode | undefined
  if (!(isLeafType(info.parentType) || source instanceof Date || info.path.prev === undefined)) {
    nestedResultNode = {
      result: source,
      type: mapResultType(getNamedType(info.parentType).name) as Type,
      children: {},
      nestedArgMap: {},
    }
  }
  const nestedArgMap = setNestedResultAndGetNestedArgMap(
    context.nestedResultMap,
    pathList,
    {},
    nestedResultNode,
  )

  const resolverContext: Context = {
    ...context,
    resultCache: context.resultCache ?? new ResultCacheImpl(),
    nestedArgMap,
  }

  let usedNestedFilters = false
  const mappingResultMapList: MappingResultMap<unknown>[] = []

  resolverContext.withNestedFilters = async <TYPE extends Type>({
    type,
    where,
    mapping,
    pluginOptions,
    excludeArgsWhere,
  }: WithNestedFiltersAttributes<TYPE>): Promise<GetWhere<TYPE>> => {
    const resolverArguments = {
      source, args, context: resolverContext, info,
    }
    usedNestedFilters = true

    const mergedMapping = {
      ...resolverContext.nestedFilterMap[type]?.declaration.mapping,
      ...mapping,
    }
    return withNestedFilters({
      mapping: mergedMapping,
      type, // TODO: validate, removing probably not desired type retrieval from info ->  info.path.typename as Type,
      where,
      resolverArguments,
      pluginOptions,
      mappingResultMapList,
      excludeArgsWhere,
    })
  }

  resolverContext.getNestedResult = async ({ type, onGet, cacheKey, cacheKeyAttribute = 'id' }) => {
    if (type in nestedArgMap) {
      return nestedArgMap[type]
    }

    if (onGet) {
      let result
      if (cacheKey !== undefined && resolverContext.resultCache.isResultCached(type, cacheKey)) {
        result = resolverContext.resultCache.getCachedResult(type, cacheKey)
      } else {
        result = await onGet()
        resolverContext.resultCache.addResultToCache(type, cacheKey === undefined ? result[cacheKeyAttribute] : cacheKey, result)
      }

      resolverContext.addNestedResult({ type, result })
      return result
    }
    throw new Error(`Nested result for (${type}) is not present.`)
  }

  resolverContext.addNestedResult = ({ type, result }) => {
    nestedArgMap[type] = result
    if (nestedResultNode) {
      nestedResultNode.nestedArgMap[type] = result
    }
  }

  const result = await resolve(source, args, resolverContext, info)

  log.debug('nestedFilterMiddleware after resolve', { pathList, mappingResultMapList, nestedArgMap: resolverContext.nestedArgMap, ignoredTypeList, usedNestedFilters })
  if (usedNestedFilters) {
    reportMissingNestedFilters(
      ignoredTypeList,
      mappingResultMapList,
      resolverContext.nestedArgMap,
    )
  }

  syncContext(context, resolverContext)
  return result
}
