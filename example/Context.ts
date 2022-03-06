/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:00+02:00
 * @Copyright: Technology Studio
**/

import { createNestedFilterMap, ResultCache, createContext as _createContext } from '@txo/nested-filter-prisma'
import { PrismaClient } from '@prisma/client'
import type { Context } from '@txo/prisma-graphql'

import { nestedFilterList } from './NestedFilters'

export const createContext = (attributes?: { resultCache?: ResultCache }): Context => _createContext({
  prisma: null as unknown as PrismaClient, // << only for tests, usually we create client here by new PrismaClient()
  nestedFilterMap: createNestedFilterMap(nestedFilterList),
  request: {
    headers: {},
  },
  resultCache: attributes?.resultCache as unknown as ResultCache,
})

export const context = createContext()
