/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T14:04:34+02:00
 * @Copyright: Technology Studio
**/

import { NestedFilterDefinitionMode } from '../Model'
import type {
  NestedFilterDeclaration,
  NestedFilterCollection,
  NestedFilterDefinition,
  NestedFilterMap,
  NestedFilterMapping,
  NestedFilterMappingValue,
  Type,
  GetWhere,
} from '../Model/Types'

import { createNestedFilter } from './NestedFilter'

const isNestedFilterDefinition = (
  collection: NestedFilterCollection,
): collection is NestedFilterDefinition => (
  collection && typeof collection === 'object' && 'mode' in collection
)

const isNestedFilterCollectionMap = (
  collection: NestedFilterCollection,
): collection is { [key: string]: NestedFilterCollection } => (
  collection && typeof collection === 'object' && !('mode' in collection)
)

const traverseNestedFilterCollection = (
  collection: NestedFilterCollection,
  callback: (nestedFilterDefinition: NestedFilterDefinition) => void,
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

const mergeNestedFilterMappingValues = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existingMappingValue: NestedFilterMappingValue<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newMappingValue: NestedFilterMappingValue<any>,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): NestedFilterMappingValue<any> => {
  if (typeof existingMappingValue === 'boolean' || typeof newMappingValue === 'boolean') {
    throw new Error('Mapping value can\'t be boolean, not supported yet')
  }

  return {
    ...(typeof existingMappingValue === 'string' ? { [existingMappingValue]: true } : existingMappingValue),
    ...(typeof newMappingValue === 'string' ? { [newMappingValue]: true } : newMappingValue),
  }
}

const mergeNestedFilterMappings = <TYPE extends Type> (
  existingMapping: NestedFilterMapping<GetWhere<TYPE>>,
  newMapping: NestedFilterMapping<GetWhere<TYPE>>,
  mode: NestedFilterDefinitionMode, // NOTE: to be used later for different merging strategies
): NestedFilterMapping<GetWhere<TYPE>> => (
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

const mergeNestedFilterDeclarations = <TYPE extends Type>(
  existingDeclaration: NestedFilterDeclaration<TYPE>,
  newDeclaration: NestedFilterDeclaration<TYPE>,
  mode: NestedFilterDefinitionMode,
): NestedFilterDeclaration<TYPE> => ({
    type: existingDeclaration.type,
    mapping: mergeNestedFilterMappings(
      existingDeclaration.mapping,
      newDeclaration.mapping,
      mode,
    ),
  })

export const produceNestedFilterDeclarationMap = (
  collection: NestedFilterCollection,
): Record<string, NestedFilterDeclaration<Type>> => {
  const declarationMap: Record<string, NestedFilterDeclaration<Type>> = {}
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

export const createNestedFilterMap = (
  collection: NestedFilterCollection,
): NestedFilterMap => {
  const declarationMap = produceNestedFilterDeclarationMap(collection)
  return Object.keys(declarationMap).reduce((nestedFilterMap: NestedFilterMap, type) => {
    nestedFilterMap[type as Type] = createNestedFilter(declarationMap[type])
    return nestedFilterMap
  }, {})
}
