/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T14:04:34+02:00
 * @Copyright: Technology Studio
**/

import { NestedFilter, NestedFilterCollection, NestedFilterMap } from '../Model/Types'

const isNestedFilter = <CONTEXT>(
  collection: NestedFilterCollection<CONTEXT>,
): collection is NestedFilter<CONTEXT> => (
    collection && typeof collection === 'object' && 'type' in collection
  )

const isNestedFilterCollectionMap = <CONTEXT>(
  collection: NestedFilterCollection<CONTEXT>,
): collection is { [key: string]: NestedFilterCollection<CONTEXT> } => (
    collection && typeof collection === 'object' && !('type' in collection)
  )

const traverseNestedFilterMap = <CONTEXT>(
  collection: NestedFilterCollection<CONTEXT>,
  callback: (nestedFilter: NestedFilter<CONTEXT>) => void,
): void => {
  if (isNestedFilter(collection)) {
    callback(collection)
  }
  if (Array.isArray(collection)) {
    collection.forEach(subCollection => traverseNestedFilterMap(subCollection, callback))
  }
  if (isNestedFilterCollectionMap(collection)) {
    Object.keys(collection).forEach(key => traverseNestedFilterMap(collection[key], callback))
  }
}

export const createNestedFilterMap = <CONTEXT>(collection: NestedFilterCollection<CONTEXT>): NestedFilterMap<CONTEXT> => {
  const nestedFilterMap: NestedFilterMap<CONTEXT> = {}
  traverseNestedFilterMap(collection, nestedFilter => {
    nestedFilterMap[nestedFilter.type] = nestedFilter
  })
  return nestedFilterMap
}
