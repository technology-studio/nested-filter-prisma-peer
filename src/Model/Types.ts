/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T18:04:92+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'
import type { Context } from '@txo/prisma-graphql'

export type ResolverArguments = {
  source: unknown,
  args: unknown,
  context: Context,
  info: GraphQLResolveInfo,
}

export interface Plugin {
  processWhere: <WHERE>(
    where: WHERE,
    resolverArguments: ResolverArguments,
    pluginOptions: PluginOptions | undefined,
  ) => WHERE,
}

export interface PluginOptions {
}
