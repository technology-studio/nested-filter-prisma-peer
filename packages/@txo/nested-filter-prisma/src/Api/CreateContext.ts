/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2022-02-13T13:02:91+01:00
 * @Copyright: Technology Studio
**/

import { PrismaClient } from '@prisma/client'
import type { Context } from '@txo/prisma-graphql'

import type { NestedFilterMap, ResultCache } from '../Model/Types'

type CreateContextAttributes = {
  prisma: PrismaClient,
  resultCache?: ResultCache | null,
  nestedFilterMap: NestedFilterMap,
  request: {
    headers: Record<string, string | string[] | undefined>,
  },
}

export const createContext = (attributes: CreateContextAttributes): Context => {
  const {
    prisma,
    resultCache = null,
    nestedFilterMap,
    request,
  } = attributes
  return {
    prisma,
    nestedFilterMap,
    nestedArgMap: {},
    rootNestedResultNode: {
      children: {},
      nestedArgMap: {},
      childrenNestedArgMap: {},
    },
    withNestedFilters: async () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    getNestedResult: async () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    addNestedResult: () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    request,
    resultCache: resultCache as unknown as ResultCache,
  }
}
