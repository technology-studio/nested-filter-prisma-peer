/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T10:04:20+02:00
 * @Copyright: Technology Studio
**/

import {
  NestedFilter,
  NestedFilterDeclaration,
  NestedFilterDefinition,
  NestedFilterDefinitionMode,
  Type,
} from '../Model'

export const nestedFilter = <TYPE extends Type>(
  declaration: NestedFilterDeclaration<TYPE>,
): NestedFilterDefinition => ({
    mode: NestedFilterDefinitionMode.MERGE,
    declaration,
  })

export const createNestedFilter = (
  declaration: NestedFilterDeclaration<Type>,
): NestedFilter => {
  return {
    type: declaration.type,
    declaration,
  }
}
