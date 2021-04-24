/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T15:04:00+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'

import type {
  Condition,
  Extension,
  ExtensionOptions,
} from '../Model/Types'

class ExtensionManager {
  _extensionList: Extension[]
  constructor () {
    this._extensionList = []
  }

  produceConditionList = <SOURCE, ARGS, CONTEXT>(
    extensionOptions: ExtensionOptions | undefined,
    source: SOURCE,
    args: ARGS,
    context: CONTEXT,
    info: GraphQLResolveInfo,
  ): Condition[] => {
    const conditionList: Condition[] = []

    this._extensionList.forEach(extension => extension.populateConditionList(
      conditionList,
      extensionOptions,
      source,
      args,
      context,
      info,
    ))
    return conditionList
  }

  registerExtension = (...extension: Extension[]): void => {
    this._extensionList.push(...extension)
  }
}

export const extensionManager = new ExtensionManager()
