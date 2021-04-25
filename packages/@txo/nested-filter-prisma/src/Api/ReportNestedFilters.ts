/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T11:04:24+02:00
 * @Copyright: Technology Studio
**/

import type {
  NestedArgMap,
  NestedFilterMapping,
} from '../Model/Types'

import { parseTypeAttributePath } from './ParseTypeAttributePath'

export const reportMissingNestedFilters = (
  nestedFilterMapping: NestedFilterMapping,
  nestedArgsMap?: NestedArgMap,
): void => {
  if (!nestedArgsMap) {
    return
  }
  const mappingTypeAttributePathList = Object.keys(nestedFilterMapping)
  const notMappedTypeList = Object.keys(nestedArgsMap)
    .filter(type => (
      type !== 'parent' &&
      mappingTypeAttributePathList.every(
        mappingTypeAttributePath => parseTypeAttributePath(mappingTypeAttributePath)?.type !== type,
      )
    ))

  if (notMappedTypeList.length > 0) {
    throw new Error(
      `Nested filters has not been mapped for following types (${notMappedTypeList.join(',')})`,
    )
  }
}
