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
  NestedFilterContext,
} from '../Model/Types'

// import { reportMissingNestedFilters } from './ReportNestedFilters'
import { resolveMapping } from './Mapping'
import { MappingResultMode, MappingResultMap } from '../Model'

const containsWhere = <ARGS>(args: ARGS): args is ARGS & { where: unknown } => (
  args && 'where' in args
)

export const withNestedFilters = async <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, TYPE extends Type>({
  mapping,
  type,
  pluginOptions,
  resolverArguments,
  mappingResultMapList,
}: {
  // TODO: add support to call resolver for filters so we allow composite constructs shared for other resolvers
  mapping: NestedFilterMapping<SOURCE, ARGS, CONTEXT, GetWhere<TYPE>>,
  resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>,
  type: Type,
  pluginOptions?: PluginOptions,
  mappingResultMapList: MappingResultMap<unknown>[],
}): Promise<GetWhere<TYPE>> => {
  const subWhereList = []
  if (containsWhere(resolverArguments.args)) {
    subWhereList.push(resolverArguments.args.where)
  }
  const mappingResultMap = await resolveMapping(
    mapping,
    resolverArguments,
  )

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
  const where = {
    AND: subWhereList,
  } as GetWhere<TYPE>

  return pluginManager.processWhere(
    where,
    resolverArguments,
    pluginOptions,
  )
}
