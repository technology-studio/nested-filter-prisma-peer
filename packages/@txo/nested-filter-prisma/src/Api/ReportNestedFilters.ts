/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T11:04:24+02:00
 * @Copyright: Technology Studio
**/

import type {
  NestedArgMap,
  NestedFilterDeclarationMap,
} from '../Model/Types'

export const reportMissingNestedFilters = (
  nestedFilterDeclarationMap: NestedFilterDeclarationMap,
  nestedArgsMap?: NestedArgMap,
): void => {
  if (!nestedArgsMap) {
    return
  }
  const declarationTypeAttributePathList = Object.keys(nestedFilterDeclarationMap)
  const notDeclaredTypeAttributePathList = Object.keys(nestedArgsMap)
    .filter(typeAttributePath => !declarationTypeAttributePathList.includes(typeAttributePath))

  if (notDeclaredTypeAttributePathList.length > 0) {
    throw new Error(
      `Nested filters has not been declared for following type attribute paths (${notDeclaredTypeAttributePathList.join(',')})`,
    )
  }
}
