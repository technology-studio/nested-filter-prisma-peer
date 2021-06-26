/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

// import { Author, Post, Comment } from '@prisma/client'
// import {
//   withNestedFilters,
//   suppressedBy,
//   ignored,
// } from '@txo/nested-filter-prisma/src'

import {
  mapFilter,
  mapValue,
} from '@txo/nested-filter-prisma/src'

// import { Context } from '../../example/ContextType'
// import { createContext } from '../../example/Context'

import { invokeResolver } from '../Utils'
import {
  AUTHOR,
  COMMENT_1,
  LEVEL_0_POST_INFO,
  LEVEL_0_RESULT_MAP,
  LEVEL_3_COMMENT_LIST_INFO, LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP, POST,
} from '../Data'
import { Author, Comment } from '@prisma/client'

// import { AUTHOR, POST, COMMENT, EmptyResolver, FAKE_INFO } from '../Data'

describe('WithNestedFilters', () => {
//   const resultWithPost = addEntityToNestedArgMap(POST, undefined, 'Post')
//   const resultWithPostAndAuthor = addEntityToNestedArgMap(AUTHOR, resultWithPost.nestedArgMap, 'Author')

  //   const resultWithPostAndComment = addEntityToNestedArgMap(COMMENT, resultWithPost.nestedArgMap, 'Comment')

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

  // test('withNestedFilters - throw exception for not mapped parent entity', async () => {
  //   const context = createContext()

  //   const resolver: EmptyResolver<Author> = withNestedFilters({
  //     mapping: {
  //       'Author.id': true,
  //     },
  //     resultType: 'Comment',
  //   })(async (parent, args, ctx, info) => {
  //     throw new Error('Won\'t reach')
  //   })

  //   return expect(
  //     resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO),
  //   ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post\)\.$/)
  // })

  //   test('withNestedFilters - should not throw exception for suppresed parent entities', async () => {
  //     const context = createContext()

  //     const resolver: EmptyResolver<Author> = withNestedFilters({
  //       mapping: {
  //         'Author.id': true,
  //       },
  //       ignore: {
  //         Post: suppressedBy('Author.id'),
  //       },
  //       resultType: 'Comment',
  //     })(async (parent, args, ctx, info) => {
  //       expect(args.where).toEqual({
  //         AND: [{
  //           author: {
  //             id: AUTHOR.id,
  //           },
  //         }],
  //       })
  //     })

  //     return resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO)
  //   })

  //   test('withNestedFilters - should not throw exception for ignored parent entities', async () => {
  //     const context = createContext()

  //     const resolver: EmptyResolver<Author> = withNestedFilters({
  //       mapping: {
  //         'Author.id': true,
  //       },
  //       ignore: {
  //         Post: ignored(),
  //       },
  //       resultType: 'Comment',
  //     })(async (parent, args, ctx, info) => {
  //       expect(args.where).toEqual({
  //         AND: [{
  //           author: {
  //             id: AUTHOR.id,
  //           },
  //         }],
  //       })
  //     })

  //     return resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO)
  //   })

  //   test('withNestedFilters - throw exception for not mapped parent entity if suppressed doesn\'t contain value', async () => {
  //     const context = createContext()

  //     const resolver: EmptyResolver<Post> = withNestedFilters({
  //       mapping: {
  //         'Author.id': true,
  //       },
  //       ignore: {
  //         Post: suppressedBy('Author.id'),
  //       },
  //       resultType: 'Comment',
  //     })(async (parent, args, ctx, info) => {
  //       throw new Error('Won\'t reach')
  //     })

  //     return expect(
  //       resolver(resultWithPost, {}, context, FAKE_INFO),
  //     ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post\)\. Suppression for type \(Post\) by type attribute path \(Author\.id\) doesn't contain value in nested arg map\.$/)
  //   })

  //   test('withNestedFilters - throw exception for not mapped parent entity if suppressed contains value, but mapping is missing', async () => {
  //     const context = createContext()

  //     const resolver: EmptyResolver<Author> = withNestedFilters({
  //       mapping: {
  //       },
  //       ignore: {
  //         Post: suppressedBy('Author.id'),
  //       },
  //       resultType: 'Comment',
  //     })(async (parent, args, ctx, info) => {
  //       throw new Error('Won\'t reach')
  //     })

  //     return expect(
  //       resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO),
  //     ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post,Author\)\. Suppression for type \(Post\) by type attribute path \(Author\.id\) doesn't exist\.$/)
  //   })

  test('withNestedFilters - with two parent entities with mapValue', async () => {
    await invokeResolver<Author, undefined, Comment[]>(async (source, args, context, info) => {
      console.log('ctx', context.nestedArgMap, context.nestedResultMap)
      const where = await context.withNestedFilters<'Comment'>({
        type: 'Comment',
        mapping: {
          Post: { post: { id: mapValue('Post.id') } },
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
      console.log('ctx', context.nestedArgMap, context.nestedResultMap)
      const where = await context.withNestedFilters<'Comment'>({
        type: 'Comment',
        mapping: {
          Post: { post: mapFilter('Post') },
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

  //   test('withNestedFilters - with transitive relation', async () => {
  //     const context = createContext()

//     const resolver: EmptyResolver<Comment> = withNestedFilters({
//       mapping: {
//         'Post.id': { 'commentList.some': 'Comment' },
//       },
//       ignore: {
//         Comment: suppressedBy('Post.id'),
//       },
//       resultType: 'Author',
//     })(async (parent, args, ctx, info) => {
//       expect(args.where).toEqual({
//         AND: [{
//           commentList: {
//             some: {
//               post: {
//                 id: POST.id,
//               },
//             },
//           },
//         }],
//       })
//     })
//     return resolver(resultWithPostAndComment, {}, context, FAKE_INFO)
//   })
})
