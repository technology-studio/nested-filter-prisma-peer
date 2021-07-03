/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-06-26T08:06:88+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'

import {
  nestedFilterMiddleware, NestedResultMap,
} from '@txo/nested-filter-prisma/src'
import { Context } from '../example/ContextType'
import { createContext } from '../example/Context'

export const invokeResolver = async <SOURCE, ARGS, RESULT>(
  resolver: (
    source: SOURCE,
    args: ARGS,
    context: Context<SOURCE, ARGS>,
    info: GraphQLResolveInfo,
  ) => Promise<RESULT>,
  source: SOURCE,
  args: ARGS,
  info: GraphQLResolveInfo,
  nestedResultMap: NestedResultMap,
): Promise<{ context: Context<SOURCE, ARGS>, result: RESULT }> => {
  const context: Context<SOURCE, ARGS> = createContext()
  context.nestedResultMap = JSON.parse(JSON.stringify(nestedResultMap))
  return {
    context,
    result: await nestedFilterMiddleware(resolver, source, args, context, info),
  }
}
