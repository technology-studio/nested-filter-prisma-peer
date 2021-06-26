/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-06-01T20:06:58+02:00
 * @Copyright: Technology Studio
 **/

import get from 'lodash.get'
import { Log } from '@txo/log'
import type { ResolverArguments } from '@txo-peer-dep/nested-filter-prisma'

import {
  MappingResult,
  MappingResultMode,
  MappingResultOptions,
  NestedFilterContext,
  Type,
  TypeAttributePath,
} from '../Model'

import { resolveMappingValue } from './Mapping'

const log = new Log('txo.nested-filter-prisma.Api.MappingFunction')

const NOT_PRESENT = '##not-present##'

export const mapValue = (
  typeAttributePath: TypeAttributePath,
) => async <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE>(
  type: Type,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>,
): Promise<MappingResult<WHERE>> => {
  // TODO retrieve type by TypeAttributePath from AllTypes
  const filterValue = get(resolverArguments.context.nestedArgMap, typeAttributePath, NOT_PRESENT)
  log.debug('mapValue', { filterValue, nestedArgMap: resolverArguments.context.nestedArgMap, typeAttributePath })
  if (filterValue === NOT_PRESENT) {
    return {
      mode: MappingResultMode.INVALID,
      options: resultOptions,
    }
  }
  return {
    mode: MappingResultMode.MERGE,
    where: filterValue as WHERE,
    options: resultOptions,
  }
}

export const mapFilter = (
  filterType: Type,
) => async <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE>(
  type: Type,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>,
): Promise<MappingResult<WHERE>> => {
  const nestedFilter = resolverArguments.context.nestedFilterMap[filterType]
  if (!nestedFilter) {
    throw new Error(`nested filter (${filterType}) is not registered yet`)
  }
  const mappingValue = nestedFilter.declaration.mapping[type]
  if (!mappingValue) {
    throw new Error(`mapping for type (${type}) in nested filter (${filterType}) is not declared`)
  }

  return resolveMappingValue(
    type,
    mappingValue,
    resultOptions,
    resolverArguments,
  ) as Promise<MappingResult<WHERE>>
}
