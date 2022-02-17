/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

import { invokeResolver } from '../Utils'
import {
  POST,
  LEVEL_1_POST_NESTED_RESULT_NODE,
  AUTHOR,
  COMMENT_1,
  LEVEL_0_POST_INFO,
  LEVEL_0_RESULT_NODE,
  LEVEL_1_COMMENT_LIST_INFO,
} from '../Data'
import { Comment, Post } from '@prisma/client'
import { AddNestedResutMode } from '@txo/nested-filter-prisma'

describe('addNestedResult', () => {
  test('addNestedResult - add result with children mode, result not available for current resolver', async () => {
    await invokeResolver<undefined, undefined, Post>(async (source, args, context, info) => {
      await expect(context.getNestedResult({ type: 'Author' })).rejects.toThrow(/^Nested result for \(Author\) is not present.$/)

      context.addNestedResult({
        type: 'Author',
        result: AUTHOR,
        mode: AddNestedResutMode.CHILDREN,
      })
      await expect(context.getNestedResult({ type: 'Author' })).rejects.toThrow(/^Nested result for \(Author\) is not present.$/)

      return POST
    }, undefined, undefined, LEVEL_0_POST_INFO, { rootNestedResultNode: LEVEL_0_RESULT_NODE })
  })

  test('addNestedResult - add result with children mode, result available for subsequent child resolver', async () => {
    const { context } = await invokeResolver<undefined, undefined, Post>(async (source, args, context, info) => {
      context.addNestedResult({
        type: 'Author',
        result: AUTHOR,
        mode: AddNestedResutMode.CHILDREN,
      })

      return POST
    }, undefined, undefined, LEVEL_0_POST_INFO, { rootNestedResultNode: LEVEL_0_RESULT_NODE })

    await invokeResolver<Post, undefined, Comment[]>(async (source, args, context, info) => {
      const author = await context.getNestedResult({ type: 'Author' })
      expect(author).toEqual(AUTHOR)
      return [COMMENT_1]
    }, POST, undefined, LEVEL_1_COMMENT_LIST_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE, context })
  })
})
