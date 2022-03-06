/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-02T08:05:60+02:00
 * @Copyright: Technology Studio
**/

import { GraphQLResolveInfo, isLeafType, getNamedType } from 'graphql'
import { Log } from '@txo/log'
import type { Context } from '@txo/prisma-graphql'

import { withNestedFilters } from '../Api/WithNestedFilters'
import {
  AddNestedResutMode,
  CacheKey,
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
    map[key] = { children: {}, nestedArgMap: {}, childrenNestedArgMap: {} }
  }
  return map[key]
}

const setNestedResultAndGetNestedArgMap = (
  nestedResultNode: NestedResultNode,
  pathList: string[],
  nestedArgMap: NestedArgMap,
  currentNestedResultNode: NestedResultNode | undefined,
): NestedArgMap => {
  if (!pathList.length) {
    throw new Error('Empty path')
  }
  const [key, ...restPathList] = pathList

  log.debug('setNestedResultAndGetNestedArgMap', { pathList, key, restPathList, nestedResultNode, nestedArgMap, currentNestedResultNode })

  if (restPathList.length > 0) {
    const childNestedResultNode = getOrCreateNode(nestedResultNode.children, key)
    const {
      type,
      result,
      nestedArgMap: nodeNestedArgMap,
    } = childNestedResultNode

    log.debug('setNestedResultAndGetNestedArgMap child', { key, childNestedResultNode })
    if (type && result) {
      nestedArgMap[type] = childNestedResultNode.result
    }

    for (const _type in nodeNestedArgMap) {
      nestedArgMap[_type as Type] = nodeNestedArgMap[_type as Type]
    }

    for (const _type in nestedResultNode.childrenNestedArgMap) {
      nestedArgMap[_type as Type] = nestedResultNode.childrenNestedArgMap[_type as Type]
    }
    if (restPathList.length > 1) {
      return setNestedResultAndGetNestedArgMap(
        childNestedResultNode,
        restPathList,
        nestedArgMap,
        currentNestedResultNode,
      )
    }
  }

  if (currentNestedResultNode) {
    nestedResultNode.children[key] = currentNestedResultNode
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    nestedArgMap[currentNestedResultNode.type!] = currentNestedResultNode.result
  }

  log.debug('setNestedResultAndGetNestedArgMap final', { pathList, key, restPathList, nestedResultNode, nestedArgMap, currentNestedResultNode })
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
      childrenNestedArgMap: {},
    }
  }
  const nestedArgMap = setNestedResultAndGetNestedArgMap(
    context.rootNestedResultNode,
    pathList,
    {},
    nestedResultNode,
  )

  if (info.path.prev === undefined) {
    nestedResultNode = context.rootNestedResultNode
  }

  const resolverContext: Context = {
    ...context,
    resultCache: context.resultCache ?? new ResultCacheImpl(),
    nestedArgMap,
  }

  let usedNestedFilters = false

  const typeToMappingResultMapList: Record<string, MappingResultMap<unknown>[]> = {}

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
      typeToMappingResultMapList,
      excludeArgsWhere,
    })
  }

  resolverContext.getNestedResult = async ({ type, onGet, cacheKey, cacheKeyAttribute = 'id', addNestedResult = false }) => {
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

  resolverContext.addNestedResult = ({ type, result, mode }) => {
    if (nestedResultNode) {
      if (mode === AddNestedResutMode.CHILDREN) {
        nestedResultNode.childrenNestedArgMap[type] = result
      } else {
        nestedArgMap[type] = result
        nestedResultNode.nestedArgMap[type] = result
      }
      log.debug('addNestedResult', { nestedArgMap })
    }
  }

  const result = await resolve(source, args, resolverContext, info)

  log.debug('nestedFilterMiddleware after resolve', { pathList, typeToMappingResultMapList, nestedArgMap: resolverContext.nestedArgMap, ignoredTypeList, usedNestedFilters })
  if (usedNestedFilters) {
    Object.keys(typeToMappingResultMapList).forEach(type => {
      reportMissingNestedFilters(
        type,
        ignoredTypeList,
        typeToMappingResultMapList[type],
        resolverContext.nestedArgMap,
      )
    })
  }

  syncContext(context, resolverContext)
  return result
}
