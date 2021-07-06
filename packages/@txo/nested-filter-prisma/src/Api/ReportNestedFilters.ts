/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T11:04:24+02:00
 * @Copyright: Technology Studio
**/

// import get from 'lodash.get'

import { ResolverArguments } from '@txo-peer-dep/nested-filter-prisma'

import { TypeIgnoreRuleMode, MappingResultMode } from '../Model'
import type {
  MappingResult,
  MappingResultMap,
  MappingResultOptions,
  NestedArgMap,
  NestedFilterContext,
  Type,
  TypeAttributePath,
  TypeIgnoreRule,
  TypeUsageRule,
} from '../Model/Types'

export const suppressedBy = (
  suppressedByType: Type,
  suppressedByTypeAttributePath: TypeAttributePath,
) => async <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE>(
  type: Type,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>,
): Promise<MappingResult<WHERE>> => {
  const typeIgnoreRule: TypeIgnoreRule = {
    type,
    mode: TypeIgnoreRuleMode.SUPPRESSED_BY,
    suppressedBy: {
      type: suppressedByType,
      typeAttributePath: suppressedByTypeAttributePath,
    },
  }
  return {
    mode: MappingResultMode.IGNORE,
    options: {
      ...resultOptions,
      typeIgnoreRuleList: [
        ...resultOptions.typeIgnoreRuleList,
        typeIgnoreRule,
      ],
    },
  }
}

export const ignored = () => async <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE>(
  type: Type,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>,
): Promise<MappingResult<WHERE>> => {
  const typeIgnoreRule: TypeIgnoreRule = {
    type,
    mode: TypeIgnoreRuleMode.IGNORED,
  }
  return {
    mode: MappingResultMode.IGNORE,
    options: {
      ...resultOptions,
      typeIgnoreRuleList: [
        ...resultOptions.typeIgnoreRuleList,
        typeIgnoreRule,
      ],
    },
  }
}

type TypeMapping = {
  usageSet: Set<string>,
}

export const reportMissingNestedFilters = (
  ignoredTypeList: string[],
  mappingResultMapList: MappingResultMap<unknown>[],
  nestedArgMap: NestedArgMap,
): void => {
  const errorMessageList: string[] = []

  const typeMappingMap: Record<string, TypeMapping> = {}
  const getOrCreate = (type: string): TypeMapping => {
    let typeMapping = typeMappingMap[type]
    if (!typeMapping) {
      typeMapping = {
        usageSet: new Set(),
      }
      typeMappingMap[type] = typeMapping
    }
    return typeMapping
  }

  const iterateValidRules = ({
    onIgnore,
    onUsage,
  }: {
    onIgnore?: (typeIgnoreRule: TypeIgnoreRule) => void,
    onUsage?: (typeUsageRule: TypeUsageRule) => void,
  }): void => {
    mappingResultMapList.forEach(mappingResultMap => {
      Object.keys(mappingResultMap).forEach(type => {
        const mappingResult = mappingResultMap[type as Type]
        if (mappingResult) {
          const {
            mode,
            options: {
              typeIgnoreRuleList,
              typeUsageRuleList,
            },
          } = mappingResult
          if (mode !== MappingResultMode.INVALID) {
            onIgnore && typeIgnoreRuleList.forEach(onIgnore)
            onUsage && typeUsageRuleList.forEach(onUsage)
          }
        }
      })
    })
  }

  iterateValidRules({
    onIgnore: ({ type, mode }) => {
      if (mode === TypeIgnoreRuleMode.IGNORED) {
        getOrCreate(type)
      }
    },
    onUsage: ({ type, typeAttributePath }) => {
      getOrCreate(type).usageSet.add(typeAttributePath)
    },
  })

  iterateValidRules({
    onIgnore: typeIgnoreRule => {
      if (typeIgnoreRule.mode === TypeIgnoreRuleMode.SUPPRESSED_BY) {
        const { type, suppressedBy } = typeIgnoreRule
        if (typeMappingMap[suppressedBy.type]?.usageSet.has(suppressedBy.typeAttributePath)) {
          getOrCreate(type)
        }
      }
    },
  })

  const mappedTypedList = Object.keys(typeMappingMap)

  const notMappedTypeList = Object.keys(nestedArgMap).filter(
    type => (
      mappedTypedList.every(mappedType => mappedType !== type) &&
      !ignoredTypeList.includes(type)
    ),
  )

  if (notMappedTypeList.length > 0) {
    throw new Error(
      `Nested filters has not been mapped for following types (${notMappedTypeList.join(',')}).` +
      (errorMessageList.length > 0 ? ' ' : '') +
      errorMessageList.join(' '),
    )
  }
}
