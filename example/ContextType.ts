/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:79+02:00
 * @Copyright: Technology Studio
**/

import type { PrismaClient } from '@prisma/client'
import type { NestedFilterMap } from '@txo/nested-filter-prisma/src'

export type Context = {
  prisma: PrismaClient,
  nestedFilterMap: NestedFilterMap<Context>,
}
