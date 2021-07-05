/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T10:04:20+02:00
 * @Copyright: Technology Studio
**/

import {
  AllNestedFilters,
  NestedFilter,
  NestedFilterContext,
  NestedFilterDeclaration,
  NestedFilterDefinition,
  NestedFilterDefinitionMode,
  Type,
} from '../Model'

export function nestedFilter <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>, TYPE extends keyof AllNestedFilters> (
  declaration: NestedFilterDeclaration<unknown, unknown, CONTEXT, TYPE>,
): NestedFilterDefinition<CONTEXT> {
  return {
    mode: NestedFilterDefinitionMode.MERGE,
    declaration,
  }
}

export function createNestedFilter <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>> (
  declaration: NestedFilterDeclaration<unknown, unknown, CONTEXT, Type>,
): NestedFilter<CONTEXT> {
  return {
    type: declaration.type,
    declaration,
  }
}
