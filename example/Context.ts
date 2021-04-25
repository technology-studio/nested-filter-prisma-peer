/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:00+02:00
 * @Copyright: Technology Studio
**/

import { createNestedFilterMap } from '@txo/nested-filter-prisma/src'
import { PrismaClient } from '@prisma/client'

import type { Context } from './ContextType'
import { nestedFilterList } from './NestedFilters'

export function createContext (): Context {
  return {
    prisma: new PrismaClient({}),
    nestedFilterMap: createNestedFilterMap(nestedFilterList),
  }
}
