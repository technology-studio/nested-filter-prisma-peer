/**
 * @Author: Ondrej Mikulas <ondrej.mikulas@technologystudio.sk>
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2020-10-17T10:10:45+02:00
 * @Copyright: Technology Studio
**/

import type { Prisma } from '@prisma/client'

import type {
  IgnoreRuleType,
  NestedFilterDefinitionMode,
} from './Enums'

export type Type = Prisma.ModelName

export type TypeAttributePath = `${Type}.${string}`

export type GetPathAttributes<CONTEXT> = {
  typeAttributePath: TypeAttributePath,
  routeAttribute?: string,
  context: CONTEXT,
  fallbackGetPath?: GetPath<CONTEXT>,
}

export type GetPath<CONTEXT> = (attributes: GetPathAttributes<CONTEXT>) => string | undefined

export type NestedFilter<CONTEXT> = {
  type: Type,
  declaration: NestedFilterDeclaration<CONTEXT>,
  getPath: (attributes: GetPathAttributes<CONTEXT>) => string,
}

export type IgnoreRule = {
  type: IgnoreRuleType.SUPPRESSED_BY,
  suppressedBy: TypeAttributePath,
} | {
  type: IgnoreRuleType.IGNORED,
}

export type IgnoreRuleMapping = {
  [KEY in Type]?: IgnoreRule
}

export type NestedFilterMappingValue = boolean | string | Record<string, Type | boolean>

// TODO: replace string with TypeAttributePath when 4.4 https://github.com/microsoft/TypeScript/pull/26797
export type NestedFilterMapping = Record<string, NestedFilterMappingValue>

export type NestedFilterDeclaration<CONTEXT> = {
  mapping: NestedFilterMapping,
  ignore?: IgnoreRuleMapping,
  type: Type,
  getPath?: GetPath<CONTEXT>,
}

export type NestedFilterDefinition<CONTEXT> = {
  mode: NestedFilterDefinitionMode,
  declaration: NestedFilterDeclaration<CONTEXT>,
}

export type NestedFilterMap<CONTEXT> = {
  [key: string]: NestedFilter<CONTEXT>,
}

export type NestedFilterCollection<CONTEXT> = NestedFilterCollection<CONTEXT>[] | NestedFilterDefinition<CONTEXT>[] | NestedFilterDefinition<CONTEXT> | {
  [key: string]: NestedFilterCollection<CONTEXT>,
}

export type ContextWithNestedFilterMap<CONTEXT> = {
  nestedFilterMap: Record<string, NestedFilter<CONTEXT>>,
}

export type InjectedContext<CONTEXT> = CONTEXT & {
  withNestedFilters: (nestedFilterMapping: NestedFilterMapping) => { AND: [] },
}

export type NestedArgMap = Record<string, Record<string, unknown>>

export type ObjectWithNestedArgMap = {
  nestedArgMap?: NestedArgMap,
}
