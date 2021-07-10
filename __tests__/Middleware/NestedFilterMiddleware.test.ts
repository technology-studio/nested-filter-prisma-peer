/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-04T07:05:49+02:00
 * @Copyright: Technology Studio
**/

import { Post, Comment } from '@prisma/client'
import type { GraphQLResolveInfo } from 'graphql'
import type { Context } from '@txo/prisma-graphql'
import { mapValue } from '@txo/nested-filter-prisma'

import {
  POST, COMMENT_1,
  COMMENT_2,
  LEVEL_0_POST_INFO,
  LEVEL_1_COMMENT_LIST_INFO,
  LEVEL_1_POST_NESTED_ARG_MAP,
  LEVEL_1_POST_NESTED_RESULT_MAP,
  LEVEL_0_RESULT_MAP,
} from '../Data'
import {
  nestedFilterMiddleware,
} from '../Utils'

import { createContext } from '../../example/Context'

describe('NestedFilterMiddleware', () => {
  const resolvePost = async (
    source: undefined,
    args: undefined,
    context: Context,
    info: GraphQLResolveInfo,
  ): Promise<Post> => {
    expect(context.nestedArgMap).toEqual({})
    return POST
  }

  test('nestedFilterMiddleware - populate empty nestedArgMap and nestedResultMap at root', async () => {
    const context: Context = createContext()
    const result = await nestedFilterMiddleware(
      resolvePost,
      undefined,
      undefined,
      context,
      LEVEL_0_POST_INFO,
    )

    expect(context.nestedResultMap).toEqual(LEVEL_0_RESULT_MAP)
    expect(result).toEqual(POST)
  })

  const resolveCommentList = async (
    source: Post,
    args: undefined,
    context: Context,
    info: GraphQLResolveInfo,
  ): Promise<Comment[]> => {
    expect(context.nestedArgMap).toEqual(LEVEL_1_POST_NESTED_ARG_MAP)
    await context.withNestedFilters({
      type: 'Comment',
      mapping: {
        Post: { post: { id: mapValue('Post.id') } },
      },
    })
    return [COMMENT_1, COMMENT_2]
  }

  test('nestedFilterMiddleware - populate nestedArgMap and nestedResultMap at 1 level', async () => {
    const context: Context = createContext()
    const resultPost = await nestedFilterMiddleware(
      resolvePost,
      undefined,
      undefined,
      context,
      LEVEL_0_POST_INFO,
    )
    const resultCommentList = await nestedFilterMiddleware(
      resolveCommentList,
      resultPost,
      undefined,
      context,
      LEVEL_1_COMMENT_LIST_INFO,
    )

    expect(context.nestedResultMap).toEqual(LEVEL_1_POST_NESTED_RESULT_MAP)
    expect(resultCommentList).toEqual([COMMENT_1, COMMENT_2])
  })
})
