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
import { reportMissingNestedFilters } from '../Api'

const log = new Log('txo.nested-filter-prisma.Middleware.NestedFilterMiddleware')

const getPathList = (path: GraphQLResolveInfo['path']): string[] => [
  ...(path.prev ? getPathList(path.prev) : []),
  path.key.toString(),
]

const getOrCreateNode = (map: NestedResultMap, key: string): NestedResultNode => {
  const value = map[key]
  if (!value) {
    map[key] = { children: {} }
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
    const { type, result, children } = getOrCreateNode(nestedResultMap, key)

    if (type && result) {
      nestedArgMap[type] = result
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

export const nestedFilterMiddlewareFactory = ({
  ignoredTypeList = [],
}: {
  ignoredTypeList?: string[],
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
      type: getNamedType(info.parentType).name as Type,
      children: {},
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
    nestedArgMap,
  }

  let usedNestedFilters = false
  const mappingResultMapList: MappingResultMap<unknown>[] = []

  resolverContext.withNestedFilters = async <TYPE extends Type>({
    type,
    mapping,
    pluginOptions,
    excludeArgsWhere,
  }: WithNestedFiltersAttributes<TYPE>): Promise<GetWhere<TYPE>> => {
    const resolverArguments = {
      source, args, context: resolverContext, info,
    }
    usedNestedFilters = true
    return withNestedFilters({
      mapping,
      type: info.path.typename as Type,
      resolverArguments,
      pluginOptions,
      mappingResultMapList,
      excludeArgsWhere,
    })
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
