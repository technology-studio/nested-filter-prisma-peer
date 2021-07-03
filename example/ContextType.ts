/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:79+02:00
 * @Copyright: Technology Studio
**/

import type { PrismaClient } from '@prisma/client'
import type { WithNestedFilterContext } from '@txo/nested-filter-prisma/src'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context<SOURCE=any, ARGS=any> = WithNestedFilterContext<SOURCE, ARGS, {
  prisma: PrismaClient,
}>
