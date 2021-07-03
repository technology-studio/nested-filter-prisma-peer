/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T18:04:92+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'

export type ResolverArguments<SOURCE, ARGS, CONTEXT> = {
  source: SOURCE,
  args: ARGS,
  context: CONTEXT,
  info: GraphQLResolveInfo,
}

export interface Plugin {
  processWhere: <SOURCE, ARGS, CONTEXT, WHERE>(
    where: WHERE,
    resolverArguments: ResolverArguments<SOURCE, ARGS, CONTEXT>,
    extensionOptions: PluginOptions | undefined,
  ) => WHERE,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginOptions {
}
