/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T10:04:20+02:00
 * @Copyright: Technology Studio
**/

import { is } from '@txo/types'

import {
  ContextWithNestedFilterMap,
  NestedFilter,
  NestedFilterDeclaration,
  NestedFilterDefinition,
  NestedFilterDefinitionMode,
  NestedFilterMappingValue,
} from '../Model'

import { parseTypeAttributePath } from './ParseTypeAttributePath'

export const nestedFilter = <CONTEXT extends ContextWithNestedFilterMap<CONTEXT>>(
  declaration: NestedFilterDeclaration<CONTEXT>,
): NestedFilterDefinition<CONTEXT> => ({
    mode: NestedFilterDefinitionMode.MERGE,
    declaration,
  })

export const createNestedFilter = <CONTEXT extends ContextWithNestedFilterMap<CONTEXT>>(
  declaration: NestedFilterDeclaration<CONTEXT>,
): NestedFilter<CONTEXT> => {
  return {
    type: declaration.type,
    declaration,
    getPath: ({ typeAttributePath, routeAttribute, context, fallbackGetPath }) => {
      const {
        mapping,
        type,
        getPath,
      } = declaration
      const errorPrefix = `${type}NestedFilter:`
      const mappingValue: NestedFilterMappingValue = mapping[typeAttributePath]

      if (mappingValue) {
        switch (typeof mappingValue) {
          case 'string':
            return mappingValue
          case 'object': {
            const routePathList = Object.keys(mappingValue)
            let routePath: string
            if (routePathList.length === 1) {
              routePath = routePathList[0]
            } else {
              // NOTE: maybe we will need to implement later picked route path from two and more levels above stored in nested args
              routePath = is(
                routeAttribute,
                () => new Error(`${errorPrefix} multiple filter routes (${routePathList.join(', ')}) for path (typeAttributePath: ${typeAttributePath}) are available but no routeAttribute has been specified`),
              )
            }
            const nestedFilterType = mappingValue[routePath]
            if (typeof nestedFilterType === 'boolean') {
              return routePath
            }
            const nestedFilter = is(
              context.nestedFilterMap[nestedFilterType],
              () => new Error(`nested filter for type ${nestedFilterType} doesn't exist`),
            )
            return routePath + '.' + nestedFilter.getPath({ typeAttributePath, context })
          }
          default: {
            throw Error(`unknown mapping type ${typeof mappingValue} for (typeAttributePath: ${typeAttributePath})`)
          }
        }
      }

      if (getPath) {
        const path = getPath({ typeAttributePath, routeAttribute, context })
        if (path) {
          return path
        }
      }

      const extractLocalAttribute = (typeAttributePath: string): string => {
        const { type: pathType, attribute } = is(
          parseTypeAttributePath(typeAttributePath),
          () => new Error(`${errorPrefix} unabled construct arbitrary path from ${typeAttributePath}`),
        )

        if (type !== pathType) {
          throw new Error(
            `${errorPrefix} arbitrary attribute mapping doesn't map type (nested filter type: ${type}, path type: ${pathType} )`,
          )
        }
        return attribute
      }
      return extractLocalAttribute(typeAttributePath)
    },
  }
}
