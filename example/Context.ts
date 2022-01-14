/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:00+02:00
 * @Copyright: Technology Studio
**/

import { createNestedFilterMap, ResultCache } from '@txo/nested-filter-prisma'
import { PrismaClient } from '@prisma/client'
import type { Context } from '@txo/prisma-graphql'

import { nestedFilterList } from './NestedFilters'

export function createContext (attributes?: { resultCache?: ResultCache | null}): Context {
  const { resultCache = null } = (attributes ?? {})
  return {
    prisma: new PrismaClient({}),
    nestedFilterMap: createNestedFilterMap(nestedFilterList),
    nestedArgMap: {},
    nestedResultMap: {},
    withNestedFilters: async () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    getNestedResult: async () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    addNestedResult: () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    request: {
      headers: {},
    },
    resultCache: resultCache as unknown as ResultCache,
  }
}

export const context = createContext()
