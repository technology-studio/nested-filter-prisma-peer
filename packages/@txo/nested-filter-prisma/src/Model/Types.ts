/**
 * @Author: Ondrej Mikulas <ondrej.mikulas@technologystudio.sk>
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2020-10-17T10:10:45+02:00
 * @Copyright: Technology Studio
**/

import type { Prisma } from '@prisma/client'

export type GetPathAttributes<CONTEXT> = {
  typeAttributePath: string,
  routeAttribute?: string,
  context: CONTEXT,
  fallbackGetPath?: GetPath<CONTEXT>,
}

export type GetPath<CONTEXT> = (attributes: GetPathAttributes<CONTEXT>) => string | undefined

export type NestedFilter<CONTEXT> = {
  type: Prisma.ModelName,
  getPath: (attributes: GetPathAttributes<CONTEXT>) => string,
}

export type NestedFilterMappingValue = boolean | string | Record<string, Prisma.ModelName | boolean>

export type NestedFilterMapping = Record<string, NestedFilterMappingValue>

export type NestedFilterDeclaration<CONTEXT> = {
  mapping: NestedFilterMapping,
  type: Prisma.ModelName,
  getPath?: GetPath<CONTEXT>,
}

export enum NestedFilterDefinitionMode {
  MERGE = 'merge',
  // TODO: later EXTEND = 'extend',
  // TODO: later OVERRIDE = 'override',
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
