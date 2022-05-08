/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-02T08:05:60+02:00
 * @Copyright: Technology Studio
**/

import { GraphQLResolveInfo, isLeafType, getNamedType } from 'graphql'
import { Log } from '@txo/log'
import type { Context } from '@txo/prisma-graphql'

import { withNestedFiltersFactory } from '../Api/WithNestedFilters'
import {
  MappingResultMap,
  NestedArgMap,
  NestedResultMap,
  NestedResultNode,
  Type,
} from '../Model/Types'
import { reportMissingNestedFilters, ResultCacheImpl } from '../Api'
import { replaceNestedResultFactory } from '../Api/ReplaceNestedResult'
import { addNestedResultFactory } from '../Api/AddNestedResult'
import { getNestedResultFactory } from '../Api/GetNestedResult'

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
  resolverContext.withNestedFilters = withNestedFiltersFactory(
    { source, args, context: resolverContext, info },
    () => { usedNestedFilters = true },
    typeToMappingResultMapList,
  )

  resolverContext.getNestedResult = getNestedResultFactory(resolverContext, nestedArgMap)
  resolverContext.addNestedResult = addNestedResultFactory(nestedResultNode, nestedArgMap)
  resolverContext.replaceNestedResult = replaceNestedResultFactory(context)

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
