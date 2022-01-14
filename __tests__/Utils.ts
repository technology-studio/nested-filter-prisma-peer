/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-06-26T08:06:88+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'
import type { Context } from '@txo/prisma-graphql'

import {
  nestedFilterMiddlewareFactory,
  NestedResultMap,
  ResultCache,
} from '@txo/nested-filter-prisma'

import { createContext } from '../example/Context'

export const nestedFilterMiddleware = nestedFilterMiddlewareFactory()

export const invokeResolver = async <SOURCE, ARGS, RESULT>(
  resolver: (
    source: SOURCE,
    args: ARGS,
    context: Context,
    info: GraphQLResolveInfo,
  ) => Promise<RESULT>,
  source: SOURCE,
  args: ARGS,
  info: GraphQLResolveInfo,
  nestedResultMap: NestedResultMap,
  options?: {
    resultCache?: ResultCache,
  },
): Promise<{ context: Context, result: RESULT }> => {
  const context: Context = createContext(options)
  context.nestedResultMap = JSON.parse(JSON.stringify(nestedResultMap))
  return {
    context,
    result: await nestedFilterMiddleware(resolver, source, args, context, info),
  }
}
