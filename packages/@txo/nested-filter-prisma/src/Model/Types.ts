/**
 * @Author: Ondrej Mikulas <ondrej.mikulas@technologystudio.sk>
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2020-10-17T10:10:45+02:00
 * @Copyright: Technology Studio
**/

import type { Prisma } from '@prisma/client'

import { GraphQLResolveInfo } from 'graphql'

export type GetPathAttributes<CONTEXT> = {
  typeAttributePath: string,
  routeAttribute?: string,
  context: CONTEXT,
}

export type GetPath<CONTEXT> = (attributes: GetPathAttributes<CONTEXT>) => string | undefined

export type NestedFilter<CONTEXT> = {
  type: Prisma.ModelName,
  getPath: (attributes: GetPathAttributes<CONTEXT>) => string,
}

export type NestedFilterMap<CONTEXT> = {
  [key: string]: NestedFilter<CONTEXT>,
}

export type NestedFilterCollection<CONTEXT> = NestedFilterCollection<CONTEXT>[] | NestedFilter<CONTEXT>[] | NestedFilter<CONTEXT> | {
  [key: string]: NestedFilterCollection<CONTEXT>,
}

export type NestedFilterDeclarationMap =(
  Record< string, boolean | string | Record<string, Prisma.ModelName>>
)

export type ContextWithNestedFilterMap<CONTEXT> = {
  nestedFilterMap: Record<string, NestedFilter<CONTEXT>>,
}

export type InjectedContext<CONTEXT> = CONTEXT & {
  withNestedFilters: (nestedFilterDeclarationMap: NestedFilterDeclarationMap) => { AND: [] },
}

export type NestedArgMap = Record<string, Record<string, unknown>>

export type ObjectWithNestedArgMap = {
  nestedArgMap?: NestedArgMap,
}

export type Condition = unknown

export interface Extension {
  populateConditionList: <SOURCE, ARGS, CONTEXT>(
    conditionList: Condition[],
    extensionOptions: ExtensionOptions | undefined,
    source: SOURCE,
    args: ARGS,
    context: CONTEXT,
    info: GraphQLResolveInfo
  ) => void,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionOptions {
}
