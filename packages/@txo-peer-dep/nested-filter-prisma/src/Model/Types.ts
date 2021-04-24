/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-24T18:04:92+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'

export type Condition = unknown

export interface Extension {
  populateConditionList: <SOURCE, ARGS, CONTEXT>(
    conditionList: Condition[],
    extensionOptions: ExtensionOptions | undefined,
    source: SOURCE,
    args: ARGS,
    context: CONTEXT,
    info: GraphQLResolveInfo
  ) => void,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionOptions {
}
