/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

import { invokeResolver } from '../Utils'
import {
  POST,
  LEVEL_1_ID_INFO,
  LEVEL_1_POST_NESTED_RESULT_MAP,
  AUTHOR,
} from '../Data'
import { Author, Post } from '@prisma/client'
import { destroyResultCache } from '@txo/nested-filter-prisma'

describe('getNestedResult', () => {
  test('getNestedResult - return existing value', async () => {
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Post' })

      expect(result).toEqual(POST)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, LEVEL_1_POST_NESTED_RESULT_MAP)
  })

  test('getNestedResult - throw exception for existing result', async () => {
    return expect(
      invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
        const result = await context.getNestedResult({ type: 'Author' })

        expect(result).toEqual(POST)
        return source.id
      }, POST, undefined, LEVEL_1_ID_INFO, LEVEL_1_POST_NESTED_RESULT_MAP),
    ).rejects.toThrow(/^Nested result for \(Author\) is not present\.$/)
  })

  test('getNestedResult - return fallback value', async () => {
    const onGet = jest.fn(async (): Promise<Author> => AUTHOR)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Author', onGet })

      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, LEVEL_1_POST_NESTED_RESULT_MAP)
    expect(onGet).toBeCalledTimes(1)
  })

  test('getNestedResult - return explicitly added result value', async () => {
    const onGet = jest.fn(async (): Promise<Author> => AUTHOR)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      await context.getNestedResult({ type: 'Author', onGet })
      const result = await context.getNestedResult({ type: 'Author', onGet })
      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, LEVEL_1_POST_NESTED_RESULT_MAP)
    expect(onGet).toBeCalledTimes(1)
  })

  test('getNestedResult - return cached value', async () => {
    destroyResultCache()
    const onGet = jest.fn(async (): Promise<Author> => AUTHOR)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Author', onGet, cacheKey: AUTHOR.id })
      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, LEVEL_1_POST_NESTED_RESULT_MAP)

    expect(onGet).toBeCalledTimes(1)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Author', onGet, cacheKey: AUTHOR.id })
      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, LEVEL_1_POST_NESTED_RESULT_MAP)
    expect(onGet).toBeCalledTimes(1)
  })
})
