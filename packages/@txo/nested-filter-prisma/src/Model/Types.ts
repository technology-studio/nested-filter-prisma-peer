/**
 * @Author: Ondrej Mikulas <ondrej.mikulas@technologystudio.sk>
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2020-10-17T10:10:45+02:00
 * @Copyright: Technology Studio
**/

import type { Prisma } from '@prisma/client'
import type { GraphQLResolveInfo } from 'graphql'

import type {
  IgnoreRuleType,
  NestedFilterDefinitionMode,
  MappingResultMode,
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

export type MappingContext = {

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MappingResultOptions {

}

export interface MappingResult<WHERE> {
  where?: WHERE,
  mode: MappingResultMode,
  options?: MappingResultOptions,
}

// const mapping = {
//   'UserAccount.id': {
//     user: nestedFilter('User')
//     user: nestedArg('UserAccount.id')
//     user:
//     user: 'user.id'
//     OR: {
//       userID:
//     }
//   }
// }

export type A = {
  AND: [A],
  some: number,
}

export type NestedFilterMappingValueObject<WHERE> = {
  [KEY in keyof WHERE]: NestedFilterMappingValue<WHERE[KEY]>
}

export interface InjectMappingFunctionArray<WHERE> extends Array<NestedFilterMappingValue<WHERE>> {}

export type NestedFilterMappingValue<WHERE> =
  WHERE extends (...args: unknown[]) => unknown
    ? WHERE
    // eslint-disable-next-line @typescript-eslint/ban-types
    : WHERE extends object
      ? NestedFilterMappingValueObject<WHERE>
      : WHERE extends unknown[]
        ? InjectMappingFunctionArray<WHERE[number]>
        : WHERE | MappingFunction<WHERE>

export type MappingFunction<WHERE> = <SOURCE, ARGS, CONTEXT extends MappingContext>(source: SOURCE, args: ARGS, context: CONTEXT, info: GraphQLResolveInfo) => Promise<MappingResult<WHERE>>

// TODO: replace string with TypeAttributePath when 4.4 https://github.com/microsoft/TypeScript/pull/26797
export type NestedFilterMapping<WHERE> = Record<string, NestedFilterMappingValue<WHERE>>

export type NestedFilterDeclaration<CONTEXT, WHERE> = {
  mapping: NestedFilterMapping<WHERE>,
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

export type InjectedContext<CONTEXT, WHERE> = CONTEXT & {
  withNestedFilters: (nestedFilterMapping: NestedFilterMapping<WHERE>) => WHERE,
}

export type NestedArgMap = Record<string, Record<string, unknown>>

export type ObjectWithNestedArgMap = {
  nestedArgMap?: NestedArgMap,
}
