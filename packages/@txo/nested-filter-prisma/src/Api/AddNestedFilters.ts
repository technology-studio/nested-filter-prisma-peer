/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T09:04:88+02:00
 * @Copyright: Technology Studio
**/

import get from 'lodash.get'
import set from 'lodash.set'
import { is } from '@txo/types'
import type { Prisma } from '@prisma/client'

import type {
  ContextWithNestedFilterMap,
  NestedArgMap,
  NestedFilterMapping,
} from '../Model/Types'

export const addNestedFilters = <
  CONDITION,
  CONTEXT extends ContextWithNestedFilterMap<CONTEXT>
>({
    nestedArgMap,
    mapping,
    conditionList,
    additionalConditionList,
    context,
    defaultNestedFilterType,
  }: {
    nestedArgMap?: NestedArgMap,
    mapping: NestedFilterMapping,
    conditionList?: CONDITION[],
    additionalConditionList?: unknown[],
    context: CONTEXT,
    defaultNestedFilterType: Prisma.ModelName,
  }): { AND: CONDITION[] } => {
  const filterList: CONDITION[] = []

  Object.entries(mapping).forEach(([typeAttributePath, mappingValue]) => {
    const filterValue = get(nestedArgMap, typeAttributePath)
    const addFilter = (filterPath: string): void => {
      const filter = set({}, filterPath, filterValue)
      // NOTE: we are not able easily validate nested filter type safety, let's ignore for now
      filterList.push(filter as CONDITION)
    }

    if (additionalConditionList) {
      // NOTE: we are not able easily validate nested filter type safety, let's ignore for now
      filterList.push(...additionalConditionList as CONDITION[])
    }

    const addNestedFilterByNestedFilterType = (
      nestedFilterType: string,
      routeAttribute?: string,
    ): void => {
      const nestedFilter = is(
        context.nestedFilterMap[nestedFilterType],
        () => new Error(`nestedFilter for type ${nestedFilterType} doesn't exist`),
      )
      const filterPath = nestedFilter.getPath({ typeAttributePath, routeAttribute, context })
      addFilter(filterPath)
    }

    if (filterValue !== undefined) {
      switch (typeof mappingValue) {
        case 'boolean': {
          addNestedFilterByNestedFilterType(defaultNestedFilterType)
          break
        }
        case 'string': {
          const filterPath = mappingValue
          addFilter(filterPath)
          break
        }
        case 'object':
          Object.entries(mappingValue).forEach(([routeAttribute, nestedFilterType]) => {
            if (typeof nestedFilterType === 'boolean') {
              addFilter(routeAttribute)
            } else {
              addNestedFilterByNestedFilterType(nestedFilterType, routeAttribute)
            }
          })
          break
      }
    }
  })
  if (conditionList) {
    filterList.push(...conditionList)
  }
  return {
    AND: filterList,
  }
}
