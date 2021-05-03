/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-02T08:05:60+02:00
 * @Copyright: Technology Studio
**/

import type { GraphQLResolveInfo } from 'graphql'

import type { ObjectWithNestedArgMap } from '../Model/Types'

export const nestedFilterMiddleware = async <
SOURCE extends ObjectWithNestedArgMap,
ARGS,
CONTEXT,
RESULT extends ObjectWithNestedArgMap
>(
  resolve: (source: SOURCE, args: ARGS, context: CONTEXT, info: GraphQLResolveInfo) => Promise<RESULT | RESULT[]>,
  source: SOURCE,
  args: ARGS,
  context: CONTEXT,
  info: GraphQLResolveInfo,
): Promise<RESULT | RESULT[]> => {
  let { nestedArgMap } = source

  if (!nestedArgMap) {
    if (info.path.prev) {
      throw Error('nestedArgMap property missing in source for path: ' + JSON.stringify(info.path))
    }
    nestedArgMap = {}
  }

  const resultOrResultList = await resolve(source, args, context, info)

  if (resultOrResultList) {
    if (Array.isArray(resultOrResultList)) {
      let modified = false
      const nextResultList = resultOrResultList.map(result => {
        if (result && !result.nestedArgMap) {
          modified = true
          return {
            ...result,
            nestedArgMap,
          }
        }
        return result
      })
      return modified ? nextResultList : resultOrResultList
    }
  }

  if (resultOrResultList && !resultOrResultList.nestedArgMap) {
    return {
      ...resultOrResultList,
      nestedArgMap,
    }
  }

  return resultOrResultList
}
