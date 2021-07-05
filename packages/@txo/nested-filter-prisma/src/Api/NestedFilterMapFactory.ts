/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T14:04:34+02:00
 * @Copyright: Technology Studio
**/

import { NestedFilterDefinitionMode } from '../Model'
import type {
  NestedFilterDeclaration,
  NestedFilterCollection,
  NestedFilterContext,
  NestedFilterDefinition,
  NestedFilterMap,
  NestedFilterMapping,
  NestedFilterMappingValue,
  Type,
  GetWhere,
} from '../Model/Types'

import { createNestedFilter } from './NestedFilter'

const isNestedFilterDefinition = <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>>(
  collection: NestedFilterCollection<CONTEXT>,
): collection is NestedFilterDefinition<CONTEXT> => (
    collection && typeof collection === 'object' && 'mode' in collection
  )

const isNestedFilterCollectionMap = <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>>(
  collection: NestedFilterCollection<CONTEXT>,
): collection is { [key: string]: NestedFilterCollection<CONTEXT> } => (
    collection && typeof collection === 'object' && !('mode' in collection)
  )

const traverseNestedFilterCollection = <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>>(
  collection: NestedFilterCollection<CONTEXT>,
  callback: (nestedFilterDefinition: NestedFilterDefinition<CONTEXT>) => void,
): void => {
  if (isNestedFilterDefinition(collection)) {
    callback(collection)
  }
  if (Array.isArray(collection)) {
    collection.forEach(subCollection => traverseNestedFilterCollection(subCollection, callback))
  }
  if (isNestedFilterCollectionMap(collection)) {
    Object.keys(collection).forEach(key => traverseNestedFilterCollection(collection[key], callback))
  }
}

const mergeNestedFilterMappingValues = <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>> (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existingMappingValue: NestedFilterMappingValue<SOURCE, ARGS, CONTEXT, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newMappingValue: NestedFilterMappingValue<SOURCE, ARGS, CONTEXT, any>,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): NestedFilterMappingValue<SOURCE, ARGS, CONTEXT, any> => {
  if (typeof existingMappingValue === 'boolean' || typeof newMappingValue === 'boolean') {
    throw new Error('Mapping value can\'t be boolean, not supported yet')
  }

  return {
    ...(typeof existingMappingValue === 'string' ? { [existingMappingValue]: true } : existingMappingValue),
    ...(typeof newMappingValue === 'string' ? { [newMappingValue]: true } : newMappingValue),
  }
}

const mergeNestedFilterMappings = <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, TYPE extends Type> (
  existingMapping: NestedFilterMapping<SOURCE, ARGS, CONTEXT, GetWhere<TYPE>>,
  newMapping: NestedFilterMapping<SOURCE, ARGS, CONTEXT, GetWhere<TYPE>>,
  mode: NestedFilterDefinitionMode, // NOTE: to be used later for different merging strategies
): NestedFilterMapping<SOURCE, ARGS, CONTEXT, GetWhere<TYPE>> => (
    Object.keys(newMapping).reduce((nextMapping, _key) => {
      const key = _key as TYPE
      if (key in nextMapping) {
        nextMapping[key] = mergeNestedFilterMappingValues(
          nextMapping[key],
          newMapping[key],
        )
      } else {
        nextMapping[key] = newMapping[key]
      }
      return nextMapping
    }, {
      ...existingMapping,
    })
  )

const mergeNestedFilterDeclarations = <SOURCE, ARGS, CONTEXT extends NestedFilterContext<SOURCE, ARGS, CONTEXT>, TYPE extends Type>(
  existingDeclaration: NestedFilterDeclaration<SOURCE, ARGS, CONTEXT, TYPE>,
  newDeclaration: NestedFilterDeclaration<SOURCE, ARGS, CONTEXT, TYPE>,
  mode: NestedFilterDefinitionMode,
): NestedFilterDeclaration<SOURCE, ARGS, CONTEXT, TYPE> => ({
    type: existingDeclaration.type,
    mapping: mergeNestedFilterMappings(
      existingDeclaration.mapping,
      newDeclaration.mapping,
      mode,
    ),
  })

export const produceNestedFilterDeclarationMap = <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>>(
  collection: NestedFilterCollection<CONTEXT>,
): Record<string, NestedFilterDeclaration<unknown, unknown, CONTEXT, Type>> => {
  const declarationMap: Record<string, NestedFilterDeclaration<unknown, unknown, CONTEXT, Type>> = {}
  traverseNestedFilterCollection(collection, ({ mode, declaration }) => {
    const existingDeclaration = declarationMap[declaration.type]
    if (existingDeclaration) {
      declarationMap[declaration.type] = mergeNestedFilterDeclarations(
        existingDeclaration,
        declaration,
        mode,
      )
    } else {
      declarationMap[declaration.type] = declaration
    }
  })
  return declarationMap
}

export const createNestedFilterMap = <CONTEXT extends NestedFilterContext<unknown, unknown, CONTEXT>>(
  collection: NestedFilterCollection<CONTEXT>,
): NestedFilterMap<CONTEXT> => {
  const declarationMap = produceNestedFilterDeclarationMap(collection)
  return Object.keys(declarationMap).reduce((nestedFilterMap: NestedFilterMap<CONTEXT>, type) => {
    nestedFilterMap[type as Type] = createNestedFilter(declarationMap[type])
    return nestedFilterMap
  }, {})
}
