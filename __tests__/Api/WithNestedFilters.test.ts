/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

import {
  ignored,
  mapFilter,
  mapValue,
  suppressedBy,
} from '@txo/nested-filter-prisma/src'

import { invokeResolver } from '../Utils'
import {
  AUTHOR,
  COMMENT_1,
  LEVEL_0_POST_INFO,
  LEVEL_0_RESULT_MAP,
  LEVEL_2_AUTHOR_INFO,
  LEVEL_2_POST_COMMENT_NESTED_RESULT_MAP,
  LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP, POST,
} from '../Data'
import { Author, Comment } from '@prisma/client'

describe('WithNestedFilters', () => {
  test('withNestedFilters - no parent entities', async () => {
    await invokeResolver<undefined, undefined, undefined>(async (source, args, context, info) => {
      const where = await context.withNestedFilters<'Post'>({
        type: 'Post',
        mapping: {
          Post: { id: mapValue('Post.id') },
          Author: { id: mapValue('Author.id') },
        },
      })
      expect(where).toEqual({
        AND: [
        ],
      })
      return undefined
    }, undefined, undefined, LEVEL_0_POST_INFO, LEVEL_0_RESULT_MAP)
  })

  test('withNestedFilters - throw exception for not mapped parent entity', async () => {
    return expect(
      invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
        await context.withNestedFilters<'Comment'>({
          type: 'Comment',
          mapping: {
            Author: { author: { id: mapValue('Author.id') } },
            Comment: ignored(),
          },
        })
        return [COMMENT_1]
      }, AUTHOR, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP),
    ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post\)\.$/)
  })

  test('withNestedFilters - should not throw exception for suppresed parent entities', async () => {
    await invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
      const where = await context.withNestedFilters<'Comment'>({
        type: 'Comment',
        mapping: {
          Author: { author: { id: mapValue('Author.id') } },
          Comment: ignored(),
          Post: suppressedBy('Author', 'Author.id'),
        },
      })
      expect(where).toEqual({
        AND: [{
          author: {
            id: AUTHOR.id,
          },
        }],
      })
      return [COMMENT_1]
    }, AUTHOR, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP)
  })

  test('withNestedFilters - throw exception for not mapped parent entity if suppressed doesn\'t contain value', async () => {
    return expect(
      invokeResolver<Record<string, unknown>, undefined, Comment[]>(async (source, args, context, info) => {
        const where = await context.withNestedFilters<'Comment'>({
          type: 'Comment',
          mapping: {
            Author: { author: { id: mapValue('Author.id') } },
            Comment: ignored(),
            Post: suppressedBy('Author', 'Author.id'),
          },
        })
        expect(where).toEqual({
          AND: [],
        })
        return [COMMENT_1]
      }, {}, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP),
    ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post,Author\)\.$/)
  })

  test('withNestedFilters - should not throw exception for ignored parent entities', async () => {
    await invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
      const where = await context.withNestedFilters<'Comment'>({
        type: 'Comment',
        mapping: {
          Author: { author: { id: mapValue('Author.id') } },
          Comment: ignored(),
          Post: ignored(),
        },
      })
      expect(where).toEqual({
        AND: [{
          author: {
            id: AUTHOR.id,
          },
        }],
      })
      return [COMMENT_1]
    }, AUTHOR, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP)
  })

  test('withNestedFilters - throw exception for not mapped parent entity if suppressed contains value, but mapping is missing', async () => {
    return expect(
      invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
        const where = await context.withNestedFilters<'Comment'>({
          type: 'Comment',
          mapping: {
            Post: suppressedBy('Author', 'Author.id'),
            Comment: ignored(),
          },
        })
        expect(where).toEqual({
          AND: [],
        })
        return [COMMENT_1]
      }, AUTHOR, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP),
    ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post,Author\)\.$/)
  })

  test('withNestedFilters - with two parent entities with mapValue', async () => {
    await invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
      const where = await context.withNestedFilters<'Comment'>({
        type: 'Comment',
        mapping: {
          Post: { post: { id: mapValue('Post.id') } },
          Comment: ignored(),
          Author: { author: { id: mapValue('Author.id') } },
        },
      })
      expect(where).toEqual({
        AND: [{
          post: {
            id: POST.id,
          },
        }, {
          author: {
            id: AUTHOR.id,
          },
        }],
      })
      return [COMMENT_1]
    }, AUTHOR, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP)
  })

  test('withNestedFilters - with two parent entities with mapFilter', async () => {
    await invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
      const where = await context.withNestedFilters<'Comment'>({
        type: 'Comment',
        mapping: {
          Post: { post: mapFilter('Post') },
          Comment: ignored(),
          Author: { author: mapFilter('Author') },
        },
      })
      expect(where).toEqual({
        AND: [{
          post: {
            id: POST.id,
            deleted: false,
          },
        }, {
          author: {
            id: AUTHOR.id,
            deleted: false,
          },
        }],
      })
      return [COMMENT_1]
    }, AUTHOR, undefined, LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP)
  })

  test('withNestedFilters - with transitive relation', async () => {
    await invokeResolver<Comment, undefined, Author>(async (source, args, context, info) => {
      const where = await context.withNestedFilters<'Author'>({
        type: 'Author',
        mapping: {
          // Author: { author: { id: mapValue('Author.id') } },
          Post: { commentList: { some: mapFilter('Comment') } },
          Comment: suppressedBy('Post', 'Post.id'),
        },
      })
      expect(where).toEqual({
        AND: [{
          commentList: {
            some: {
              post: {
                id: POST.id,
                deleted: false,
              },
            },
          },
        }],
      })
      return AUTHOR
    }, COMMENT_1, undefined, LEVEL_2_AUTHOR_INFO, LEVEL_2_POST_COMMENT_NESTED_RESULT_MAP)
  })
})
