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

export type NestedFilter<TYPE extends Type = Type> = {
  type: TYPE,
  declaration: NestedFilterDeclaration<TYPE>,
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

export type MappingFunction<WHERE> = (
  type: Type,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments
) => Promise<MappingResult<WHERE>>

// TODO: replace string with TypeAttributePath when 4.4 https://github.com/microsoft/TypeScript/pull/26797
export type NestedFilterMapping<WHERE> = {
  [KEY in Type]?: NestedFilterMappingValue<WHERE> | MappingFunction<WHERE>
}

export type NestedFilterDeclaration<TYPE extends Type> = {
  type: TYPE,
  mapping: NestedFilterMapping<GetWhere<TYPE>>,
}

export type NestedFilterDefinition<TYPE extends Type = Type> = {
  mode: NestedFilterDefinitionMode,
  declaration: NestedFilterDeclaration<TYPE>,
}

export type NestedFilterMap = {
  [TYPE in Type]?: NestedFilter
}

export type NestedFilterCollection = (
  NestedFilterCollection[] |
  NestedFilterDefinition[] |
  NestedFilterDefinition | {
    [key: string]: NestedFilterCollection,
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

declare module '@txo/prisma-graphql/lib/Model/Types' {
  export interface Context {
    nestedArgMap: NestedArgMap,
    nestedResultMap: NestedResultMap,
    nestedFilterMap: NestedFilterMap,
    withNestedFilters: <TYPE extends Type> (
      attributes: WithNestedFiltersAttributes<TYPE>
    ) => Promise<GetWhere<TYPE>>,
  }
}

export type WithNestedFiltersAttributes<TYPE extends Type> = {
  type: TYPE,
  mapping?: NestedFilterMapping<GetWhere<TYPE>>,
  where?: NestedFilterMappingValue<GetWhere<TYPE>>,
  pluginOptions?: PluginOptions,
  excludeArgsWhere?: boolean,
}

export type NestedArgMap = {
  [KEY in Type]?: GetStructure<KEY>
}
