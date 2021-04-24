/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T10:04:20+02:00
 * @Copyright: Technology Studio
**/

import { is } from '@txo/types'
import type { Prisma } from '@prisma/client'

import type {
  ContextWithNestedFilterMap,
  GetPath,
  NestedFilter,
  NestedFilterDeclarationMap,
} from '../Model/Types'

export const nestedFilter = <CONTEXT extends ContextWithNestedFilterMap<CONTEXT>>({
  map,
  type,
  getPath,
}: {
  map: NestedFilterDeclarationMap,
  type: Prisma.ModelName,
  getPath?: GetPath<CONTEXT>,
}): NestedFilter<CONTEXT> => {
  return {
    type,
    getPath: ({ typeAttributePath, routeAttribute, context }) => {
      const errorPrefix = `${type}NestedFilter:`
      const declaration = map[typeAttributePath]

      if (declaration) {
        switch (typeof declaration) {
          case 'string':
            return declaration
          case 'object': {
            const routePathList = Object.keys(declaration)
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
            const nestedFilterType = declaration[routePath]
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
            throw Error(`unknown declaration type ${typeof declaration} for (typeAttributePath: ${typeAttributePath})`)
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
        const typeAndAttributePair = typeAttributePath.split('.')
        if (typeAndAttributePair.length !== 2) {
          throw new Error(`${errorPrefix} unabled construct arbitrary path from ${typeAttributePath}`)
        }
        const [pathType, attributeName] = typeAndAttributePair
        if (type !== pathType) {
          throw new Error(
            `${errorPrefix} arbitrary attribute mapping doesn't map type (nested filter type: ${type}, path type: ${pathType} )`,
          )
        }
        return attributeName
      }
      return extractLocalAttribute(typeAttributePath)
    },
  }
}
