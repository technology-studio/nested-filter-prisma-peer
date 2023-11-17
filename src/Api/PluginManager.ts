/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T15:04:00+02:00
 * @Copyright: Technology Studio
**/

import type {
  Plugin,
  PluginOptions,
  ResolverArguments,
} from '../Model/Types'

class PluginManager {
  _pluginList: Plugin[]
  constructor () {
    this._pluginList = []
  }

  processWhere = <WHERE>(
    where: WHERE,
    resolverArguments: ResolverArguments,
    pluginOptions: PluginOptions | undefined,
  ): WHERE => this._pluginList.reduce((where, plugin) => plugin.processWhere(
    where,
    resolverArguments,
    pluginOptions,
  ), where)

  registerPlugin = (...pluginList: Plugin[]): void => {
    this._pluginList.push(...pluginList)
  }
}

export const pluginManager = new PluginManager()
