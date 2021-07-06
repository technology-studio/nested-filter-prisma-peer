/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-02T08:05:60+02:00
 * @Copyright: Technology Studio
**/

import { GraphQLResolveInfo, isLeafType, getNamedType } from 'graphql'
import { Log } from '@txo/log'

import { withNestedFilters } from '../Api/WithNestedFilters'
import type {
  GetWhere,
  MappingResultMap,
  NestedArgMap,
  NestedFilterContext,
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

export const nestedFilterMiddlewareFactory = ({
  ignoredTypeList = [],
}: {
  ignoredTypeList?: string[],
} = {}) => async <
SOURCE,
ARGS,
CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>,
RESULT
>(
  resolve: (source: SOURCE, args: ARGS, context: CONTEXT, info: GraphQLResolveInfo) => Promise<RESULT>,
  source: SOURCE,
  args: ARGS,
  context: CONTEXT,
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
  context.nestedArgMap = nestedArgMap

  const resolverContext = context

  let usedNestedFilters = false
  const mappingResultMapList: MappingResultMap<unknown>[] = []
  resolverContext.withNestedFilters = async <TYPE extends Type>({
    type,
    mapping,
    pluginOptions,
  }: WithNestedFiltersAttributes<SOURCE, ARGS, CONTEXT, TYPE>): Promise<GetWhere<TYPE>> => {
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
    })
  }
  const previousNestedArgMap = context.nestedArgMap

  const result = await resolve(source, args, resolverContext, info)

  log.debug('nestedFilterMiddleware after resolve', { mappingResultMapList, nestedArgMap: context.nestedArgMap, ignoredTypeList, usedNestedFilters })
  if (usedNestedFilters) {
    reportMissingNestedFilters(
      ignoredTypeList,
      mappingResultMapList,
      context.nestedArgMap,
    )
  }

  context.nestedArgMap = previousNestedArgMap
  delete (resolverContext as Record<string, unknown>).withNestedFilters

  return result
}
