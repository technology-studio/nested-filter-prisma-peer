/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T14:04:34+02:00
 * @Copyright: Technology Studio
**/

import type {
  NestedFilterDeclaration,
  NestedFilterCollection,
  NestedFilterDefinition,
  NestedFilterMap,
  NestedFilterMapping,
  NestedFilterDefinitionMode,
  NestedFilterMappingValue,
  ContextWithNestedFilterMap,
} from '../Model/Types'

import { createNestedFilter } from './NestedFilter'

const isNestedFilterDefinition = <CONTEXT>(
  collection: NestedFilterCollection<CONTEXT>,
): collection is NestedFilterDefinition<CONTEXT> => (
    collection && typeof collection === 'object' && 'mode' in collection
  )

const isNestedFilterCollectionMap = <CONTEXT>(
  collection: NestedFilterCollection<CONTEXT>,
): collection is { [key: string]: NestedFilterCollection<CONTEXT> } => (
    collection && typeof collection === 'object' && !('mode' in collection)
  )

const traverseNestedFilterCollection = <CONTEXT>(
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

const mergeNestedFilterMappingValues = (
  existingMappingValue: NestedFilterMappingValue,
  newMappingValue: NestedFilterMappingValue,
): NestedFilterMappingValue => {
  if (typeof existingMappingValue === 'boolean' || typeof newMappingValue === 'boolean') {
    throw new Error('Mapping value can\'t be boolean, not supported yet')
  }

  return {
    ...(typeof existingMappingValue === 'string' ? { [existingMappingValue]: true } : existingMappingValue),
    ...(typeof newMappingValue === 'string' ? { [newMappingValue]: true } : newMappingValue),
  }
}

const mergeNestedFilterMappings = (
  existingMapping: NestedFilterMapping,
  newMapping: NestedFilterMapping,
  mode: NestedFilterDefinitionMode, // NOTE: to be used later for different merging strategies
): NestedFilterMapping => (
  Object.keys(newMapping).reduce((nextMapping, key) => {
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

const mergeNestedFilterDeclarations = <CONTEXT>(
  existingDeclaration: NestedFilterDeclaration<CONTEXT>,
  newDeclaration: NestedFilterDeclaration<CONTEXT>,
  mode: NestedFilterDefinitionMode,
): NestedFilterDeclaration<CONTEXT> => ({
    type: existingDeclaration.type,
    mapping: mergeNestedFilterMappings(
      existingDeclaration.mapping,
      newDeclaration.mapping,
      mode,
    ),
    getPath: (
      newDeclaration.getPath && existingDeclaration.getPath
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ? attributes => newDeclaration.getPath!({
          ...attributes,
          fallbackGetPath: existingDeclaration.getPath,
        })
        : newDeclaration.getPath ?? existingDeclaration.getPath
    ),
  })

export const produceNestedFilterDeclarationMap = <CONTEXT>(
  collection: NestedFilterCollection<CONTEXT>,
): Record<string, NestedFilterDeclaration<CONTEXT>> => {
  const declarationMap: Record<string, NestedFilterDeclaration<CONTEXT>> = {}
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

export const createNestedFilterMap = <CONTEXT extends ContextWithNestedFilterMap<CONTEXT>>(
  collection: NestedFilterCollection<CONTEXT>,
): NestedFilterMap<CONTEXT> => {
  const declarationMap = produceNestedFilterDeclarationMap(collection)
  return Object.keys(declarationMap).reduce((nestedFilterMap: NestedFilterMap<CONTEXT>, type) => {
    nestedFilterMap[type] = createNestedFilter(declarationMap[type])

    return nestedFilterMap
  }, {})
}
