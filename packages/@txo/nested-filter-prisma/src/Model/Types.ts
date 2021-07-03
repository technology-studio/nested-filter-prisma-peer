/**
 * @Author: Ondrej Mikulas <ondrej.mikulas@technologystudio.sk>
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2020-10-17T10:10:45+02:00
 * @Copyright: Technology Studio
**/

import type { ResolverArguments, PluginOptions } from '@txo-peer-dep/nested-filter-prisma'

import type {
  TypeIgnoreRuleMode,
  NestedFilterDefinitionMode,
  MappingResultMode,
} from './Enums'

export interface AllNestedFilters {
  Placeholder: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    structure: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: any,
  },
}

export type Type = keyof AllNestedFilters

export type GetWhere<TYPE extends Type> = AllNestedFilters[TYPE]['where']

export type GetStructure<TYPE extends Type> = AllNestedFilters[TYPE]['structure']

type Values<T> = T[keyof T]

type GetAttributePath<TYPE extends string, STRUCTURE> = Values<{
  [KEY in keyof STRUCTURE]: KEY extends string ? `${TYPE}.${KEY}` : never
}>

export type TypeAttributePath = Values<{
  [KEY in keyof AllNestedFilters]: GetAttributePath<KEY, AllNestedFilters[KEY]['structure']>
}>

export type AllStructures = Values<{
  [KEY in keyof AllNestedFilters]: AllNestedFilters[KEY]['structure']
}>

export type NestedFilter<CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>, TYPE extends Type = Type> = {
  type: TYPE,
  declaration: NestedFilterDeclaration<unknown, unknown, CONTEXT, TYPE>,
}

export type SuppressedBy = {
  type: Type,
  typeAttributePath: TypeAttributePath,
}

export type TypeIgnoreRule = {
  type: Type,
  mode: TypeIgnoreRuleMode.SUPPRESSED_BY,
  suppressedBy: SuppressedBy,
} | {
  type: Type,
  mode: TypeIgnoreRuleMode.IGNORED,
}

export type MappingContext = {

}

export type TypeUsageRule = {
  type: Type,
  typeAttributePath: TypeAttributePath,
}

export interface MappingResultOptions {
  typeIgnoreRuleList: TypeIgnoreRule[],
  typeUsageRuleList: TypeUsageRule[],
}

export interface MappingResult<WHERE> {
  where?: WHERE,
  mode: MappingResultMode,
  options: MappingResultOptions,
}

export type MappingResultMap<WHERE> = {
  [KEY in Type]?: MappingResult<WHERE>
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

export type NestedFilterMappingValueObject<SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE> = {
  [KEY in keyof WHERE]: NestedFilterMappingValue<SOURCE, ARGS, CONTEXT, WHERE[KEY]>
}

export interface InjectMappingFunctionArray<SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE> extends Array<NestedFilterMappingValue<SOURCE, ARGS, CONTEXT, WHERE>> {}

export type NestedFilterMappingValue<SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE> =
  WHERE extends (...args: unknown[]) => unknown
    ? WHERE
    // eslint-disable-next-line @typescript-eslint/ban-types
    : WHERE extends object
      ? NestedFilterMappingValueObject<SOURCE, ARGS, CONTEXT, WHERE>
      : WHERE extends unknown[]
        ? InjectMappingFunctionArray<SOURCE, ARGS, CONTEXT, WHERE[number]>
        : WHERE | MappingFunction<SOURCE, ARGS, CONTEXT, WHERE>

export type MappingFunction<SOURCE, ARGS, CONTEXT, WHERE> = (
  type: Type,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>
) => Promise<MappingResult<WHERE>>

// TODO: replace string with TypeAttributePath when 4.4 https://github.com/microsoft/TypeScript/pull/26797
export type NestedFilterMapping<SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, WHERE> = {
  [KEY in Type]?: NestedFilterMappingValue<SOURCE, ARGS, CONTEXT, WHERE> | MappingFunction<SOURCE, ARGS, CONTEXT, WHERE>
}

export type NestedFilterDeclaration<SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, TYPE extends Type> = {
  type: TYPE,
  mapping: NestedFilterMapping<SOURCE, ARGS, CONTEXT, GetWhere<TYPE>>,
}

export type NestedFilterDefinition<CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>, TYPE extends Type = Type> = {
  mode: NestedFilterDefinitionMode,
  declaration: NestedFilterDeclaration<unknown, unknown, CONTEXT, TYPE>,
}

export type NestedFilterMap<CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>> = {
  [TYPE in Type]?: NestedFilter<CONTEXT>
}

export type NestedFilterCollection<CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>> = (
  NestedFilterCollection<CONTEXT>[] |
  NestedFilterDefinition<CONTEXT>[] |
  NestedFilterDefinition<CONTEXT> | {
    [key: string]: NestedFilterCollection<CONTEXT>,
  }
)

export type NestedResultNode = {
  result?: AllStructures,
  type?: Type,
  children: NestedResultMap,
}

export type NestedResultMap = {
  [key: string]: NestedResultNode,
}

export type NestedFilterContext<SOURCE, ARGS, CONTEXT> = {
  nestedArgMap: NestedArgMap,
  nestedResultMap: NestedResultMap,
  nestedFilterMap: NestedFilterMap<WithNestedFilterContext<unknown, unknown, CONTEXT>>,
  withNestedFilters: <TYPE extends Type> (
    attributes: WithNestedFiltersAttributes<SOURCE, ARGS, WithNestedFilterContext<SOURCE, ARGS, CONTEXT>, TYPE>
  ) => Promise<GetWhere<TYPE>>,
}

export type WithNestedFilterContext<SOURCE, ARGS, CONTEXT> = CONTEXT & NestedFilterContext<SOURCE, ARGS, CONTEXT>

export type WithNestedFiltersAttributes<SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, TYPE extends Type> = {
  type: TYPE,
  mapping: NestedFilterMapping<SOURCE, ARGS, CONTEXT, GetWhere<TYPE>>,
  pluginOptions?: PluginOptions,
}

export type NestedArgMap = {
  [KEY in Type]?: GetStructure<KEY>
}
