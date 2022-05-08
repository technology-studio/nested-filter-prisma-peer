/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T09:04:25+02:00
 * @Copyright: Technology Studio
**/

import { pluginManager, PluginOptions, ResolverArguments } from '@txo-peer-dep/nested-filter-prisma'

import type {
  NestedFilterMapping,
  Type,
  GetWhere,
  NestedFilterMappingValue,
  WithNestedFiltersAttributes,
  MappingResultMap,
} from '../Model/Types'
import { MappingResultMode } from '../Model'

// import { reportMissingNestedFilters } from './ReportNestedFilters'
import { resolveMapping, resolveMappingValue } from './Mapping'

const containsWhere = <ARGS>(args: ARGS): args is ARGS & { where: unknown } => (
  args && 'where' in args
)

export const withNestedFilters = async <TYPE extends Type>({
  mapping,
  where,
  type,
  pluginOptions,
  resolverArguments,
  typeToMappingResultMapList,
  excludeArgsWhere,
}: {
  // TODO: add support to call resolver for filters so we allow composite constructs shared for other resolvers
  mapping: NestedFilterMapping<GetWhere<TYPE>>,
  where?: NestedFilterMappingValue<GetWhere<TYPE>>,
  resolverArguments: ResolverArguments,
  type: Type,
  pluginOptions?: PluginOptions,
  typeToMappingResultMapList: Record<Type, MappingResultMap<unknown>[]>,
  excludeArgsWhere?: boolean,
}): Promise<GetWhere<TYPE>> => {
  const subWhereList = []
  if (containsWhere(resolverArguments.args) && !excludeArgsWhere) {
    subWhereList.push(resolverArguments.args.where)
  }
  const mappingResultMap = await resolveMapping(
    mapping,
    resolverArguments,
  )

  if (where) {
    const whereResult = await resolveMappingValue(
      type,
      where,
      { typeIgnoreRuleList: [], typeUsageRuleList: [] },
      resolverArguments,
    )
    switch (whereResult.mode) {
      case MappingResultMode.ASSIGN:
      case MappingResultMode.MERGE: {
        subWhereList.push(whereResult.where)
      }
    }
  }

  let mappingResultMapList = typeToMappingResultMapList[type]
  if (!mappingResultMapList) {
    mappingResultMapList = []
    typeToMappingResultMapList[type] = mappingResultMapList
  }

  mappingResultMapList.push(mappingResultMap)

  const nestedArgMap = resolverArguments.context.nestedArgMap

  Object.keys(mappingResultMap).forEach(type => {
    const mappingResult = mappingResultMap[type as Type]
    if (mappingResult) {
      const { mode, where } = mappingResult
      switch (mode) {
        case MappingResultMode.ASSIGN:
        case MappingResultMode.MERGE: {
          if (type in nestedArgMap && where) {
            subWhereList.push(where)
          }
          break
        }
        case MappingResultMode.IGNORE:
        case MappingResultMode.INVALID:
          break
        default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`not processed mapping result mode (${mode})`)
      }
    }
  })

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const resultWhere = {
    AND: subWhereList,
  } as GetWhere<TYPE>

  return pluginManager.processWhere(
    resultWhere,
    resolverArguments,
    pluginOptions,
  )
}

export const withNestedFiltersFactory = (
  resolverArguments: ResolverArguments,
  setUsedNestedFilters: () => void,
  typeToMappingResultMapList: Record<string, MappingResultMap<unknown>[]>,
) => async <TYPE extends Type>({
  type,
  where,
  mapping,
  pluginOptions,
  excludeArgsWhere,
}: WithNestedFiltersAttributes<TYPE>): Promise<GetWhere<TYPE>> => {
  setUsedNestedFilters()
  const mergedMapping = {
    ...resolverArguments.context.nestedFilterMap[type]?.declaration.mapping,
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
