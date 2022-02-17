/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-06-26T08:06:88+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'
import type { Context } from '@txo/prisma-graphql'

import {
  nestedFilterMiddlewareFactory,
  NestedResultNode,
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
  options?: {
    rootNestedResultNode?: NestedResultNode,
    resultCache?: ResultCache,
    context?: Context,
  },
): Promise<{ context: Context, result: RESULT }> => {
  const context: Context = options?.context ?? createContext(options)
  if (options?.rootNestedResultNode && !options?.context) {
    context.rootNestedResultNode = JSON.parse(JSON.stringify(options.rootNestedResultNode))
  }
  return {
    context,
    result: await nestedFilterMiddleware(resolver, source, args, context, info),
  }
}
