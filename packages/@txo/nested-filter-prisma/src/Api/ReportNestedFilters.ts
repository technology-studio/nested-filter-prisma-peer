/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T11:04:24+02:00
 * @Copyright: Technology Studio
**/

import get from 'lodash.get'

import { IgnoreRuleType } from '../Model'
import type {
  IgnoreRule,
  IgnoreRuleMapping,
  NestedArgMap,
  NestedFilterMapping,
  Type,
  TypeAttributePath,
} from '../Model/Types'

import { parseTypeAttributePath } from './ParseTypeAttributePath'

export const suppressedBy = (typeAttributePath: TypeAttributePath): IgnoreRule => ({
  type: IgnoreRuleType.SUPPRESSED_BY,
  suppressedBy: typeAttributePath,
})

export const ignored = (): IgnoreRule => ({
  type: IgnoreRuleType.IGNORED,
})

const isIgnored = (
  type: Type,
  nestedFilterMapping: NestedFilterMapping,
  ignoreRuleMapping: IgnoreRuleMapping,
  nestedArgMap: NestedArgMap,
  errorMessageList: string[],
): boolean => {
  const ignoreRule = ignoreRuleMapping[type]
  if (ignoreRule) {
    switch (ignoreRule.type) {
      case IgnoreRuleType.IGNORED:
        return true
      case IgnoreRuleType.SUPPRESSED_BY: {
        if (nestedFilterMapping[ignoreRule.suppressedBy]) {
          const nestedArgValue = get(nestedArgMap, ignoreRule.suppressedBy)
          if (nestedArgValue !== undefined) {
            return true
          }
          errorMessageList.push(`Suppression for type (${type}) by type attribute path (${ignoreRule.suppressedBy}) doesn't contain value in nested arg map.`)
          return false
        }
        errorMessageList.push(`Suppression for type (${type}) by type attribute path (${ignoreRule.suppressedBy}) doesn't exist.`)
        return false
      }
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Not implemented ignore rule type (${ignoreRule})`)
    }
  }
  return false
}

export const reportMissingNestedFilters = (
  nestedFilterMapping: NestedFilterMapping,
  ignoreRuleMapping: IgnoreRuleMapping,
  nestedArgMap: NestedArgMap,
): void => {
  const errorMessageList: string[] = []
  if (!nestedArgMap) {
    return
  }
  const mappingTypeAttributePathList = Object.keys(nestedFilterMapping)
  const notMappedTypeList = Object.keys(nestedArgMap)
    .filter(type => (
      type !== 'parent' &&
      !isIgnored(type as Type, nestedFilterMapping, ignoreRuleMapping, nestedArgMap, errorMessageList) &&
      mappingTypeAttributePathList.every(
        mappingTypeAttributePath => parseTypeAttributePath(mappingTypeAttributePath)?.type !== type,
      )
    ))

  if (notMappedTypeList.length > 0) {
    throw new Error(
      `Nested filters has not been mapped for following types (${notMappedTypeList.join(',')}).` +
      (errorMessageList.length > 0 ? ' ' : '') +
      errorMessageList.join(' '),
    )
  }
}
