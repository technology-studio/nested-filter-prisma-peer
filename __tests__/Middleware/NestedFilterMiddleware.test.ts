/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-04T07:05:49+02:00
 * @Copyright: Technology Studio
**/

import { Post } from '@prisma/client'
import type { GraphQLResolveInfo } from 'graphql'
import { nestedFilterMiddleware, ObjectWithNestedArgMap } from '@txo/nested-filter-prisma/src'

import { FAKE_ROOT_INFO, POST } from '../Data'

type PostWithNestedArgMap = Post & ObjectWithNestedArgMap
describe('NestedFilterMiddleware', () => {
  test('nestedFilterMiddleware - auto inject empty nestedArgMap for root resolver', async () => {
    const resolve = async (source: ObjectWithNestedArgMap | undefined, args: null, context: null, info: GraphQLResolveInfo): Promise<PostWithNestedArgMap[]> => {
      return [{ ...POST }]
    }
    const result = await nestedFilterMiddleware(resolve, undefined, null, null, FAKE_ROOT_INFO)

    expect(result).toEqual([{
      ...POST,
      nestedArgMap: {},
    }])
  })
})
