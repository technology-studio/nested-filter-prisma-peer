/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T09:04:25+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'
import type { Prismify } from '@txo/nexus-prisma'
import type { Prisma } from '@prisma/client'
import { extensionManager, ExtensionOptions } from '@txo-peer-dep/nested-filter-prisma'

import type {
  ContextWithNestedFilterMap,
  NestedFilterMapping,
  ObjectWithNestedArgMap,
  InjectedContext,
} from '../Model/Types'

import { addNestedFilters } from './AddNestedFilters'
import { addEntityToNestedArgMap } from './AddEntityToNestedArgMap'
import { reportMissingNestedFilters } from './ReportNestedFilters'

type InjectedArgs<ARGS> = ARGS extends { where: infer WHERE }
  ? Omit<ARGS, 'where'> & { where: { AND: WHERE[] }}
  : ARGS & { where: { AND: [] } }

export const withNestedFilters = ({
  mapping,
  resultType,
  extensionOptions,
}: {
  // TODO: add support to call resolver for filters so we allow composite constructs shared for other resolvers
  mapping: NestedFilterMapping,
  resultType: Prisma.ModelName,
  extensionOptions?: ExtensionOptions,
}) => <SOURCE, WHERE, ARGS extends { where?: WHERE }, CONTEXT extends ContextWithNestedFilterMap<CONTEXT>, RETURN_TYPE>(
  resolver: (
    source: SOURCE,
    args: Prismify<InjectedArgs<ARGS>>,
    context: InjectedContext<CONTEXT>,
    info: GraphQLResolveInfo,
    originalArgs: ARGS
  ) => Promise<RETURN_TYPE>,
) => async (
    source: SOURCE,
    args: ARGS,
    context: CONTEXT,
    info: GraphQLResolveInfo,
  ): Promise<RETURN_TYPE> => {
    const additionalConditionList = extensionManager.produceConditionList(
      extensionOptions,
      source,
      args,
      context,
      info,
    )

    const { nestedArgMap } = source as ObjectWithNestedArgMap

    reportMissingNestedFilters(mapping, nestedArgMap)

    const addNestedFiltersBaseAttributes = {
      nestedArgMap,
      mapping,
      additionalConditionList,
      context,
      defaultNestedFilterType: resultType,
    }
    const nextWhere = addNestedFilters({
      ...addNestedFiltersBaseAttributes,
      conditionList: args.where ? [args.where] : [],
    })

    const nextArgs = {
      ...args,
      where: nextWhere,
    }

    const injectedContext = context as InjectedContext<CONTEXT>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    injectedContext.withNestedFilters = (mapping: NestedFilterMapping): any => {
      return addNestedFilters({
        ...addNestedFiltersBaseAttributes,
        mapping,
      })
    }
    const resultOrResultList = await resolver(
      source,
      nextArgs as Prismify<InjectedArgs<ARGS>>,
      injectedContext,
      info,
      args,
    )

    delete (injectedContext as Record<string, unknown>).withNestedFilters

    if (Array.isArray(resultOrResultList)) {
      return resultOrResultList.map(result => {
        if (!result) {
          return result
        }
        return addEntityToNestedArgMap(
          result,
          nestedArgMap,
          resultType,
        )
      }) as unknown as RETURN_TYPE
    }
    if (!resultOrResultList) {
      return resultOrResultList
    }
    return addEntityToNestedArgMap(
      resultOrResultList,
      nestedArgMap,
      resultType,
    )
  }
