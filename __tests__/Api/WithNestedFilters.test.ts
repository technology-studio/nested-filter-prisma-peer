/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

import { Author, Post } from '@prisma/client'
import {
  addEntityToNestedArgMap,
  ObjectWithNestedArgMap,
  withNestedFilters,
  suppressedBy,
  ignored,
} from '@txo/nested-filter-prisma/src'

import { GraphQLResolveInfo } from 'graphql'

import { createContext } from '../../example/Context'
import type { Context } from '../../example/ContextType'
import { AUTHOR, POST } from '../Data'

type EmptyResolver<SOURCE = ObjectWithNestedArgMap> = (
  source: SOURCE,
  args: { where?: unknown },
  context: Context,
  info: GraphQLResolveInfo
) => Promise<void>

const FAKE_INFO = null as unknown as GraphQLResolveInfo

describe('WithNestedFilters', () => {
  const resultWithPost = addEntityToNestedArgMap(POST, undefined, 'Post')
  const resultWithPostAndAuthor = addEntityToNestedArgMap(AUTHOR, resultWithPost.nestedArgMap, 'Author')

  test('withNestedFilters - no parent entities', async () => {
    const context = createContext()
    const resolver: EmptyResolver = withNestedFilters({
      mapping: {
        'Pos.id': true,
        'Author.id': true,
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      expect(args.where).toEqual({
        AND: [
        ],
      })
    })

    return resolver({}, {}, context, FAKE_INFO)
  })

  test('withNestedFilters - throw exception for not mapped parent entity', async () => {
    const context = createContext()

    const resolver: EmptyResolver<Author> = withNestedFilters({
      mapping: {
        'Author.id': true,
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      throw new Error('Won\'t reach')
    })

    return expect(
      resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO),
    ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post\)\.$/)
  })

  test('withNestedFilters - should not throw exception for suppresed parent entities', async () => {
    const context = createContext()

    const resolver: EmptyResolver<Author> = withNestedFilters({
      mapping: {
        'Author.id': true,
      },
      ignore: {
        Post: suppressedBy('Author.id'),
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      expect(args.where).toEqual({
        AND: [{
          author: {
            id: AUTHOR.id,
          },
        }],
      })
    })

    return resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO)
  })

  test('withNestedFilters - should not throw exception for ignored parent entities', async () => {
    const context = createContext()

    const resolver: EmptyResolver<Author> = withNestedFilters({
      mapping: {
        'Author.id': true,
      },
      ignore: {
        Post: ignored(),
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      expect(args.where).toEqual({
        AND: [{
          author: {
            id: AUTHOR.id,
          },
        }],
      })
    })

    return resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO)
  })

  test('withNestedFilters - throw exception for not mapped parent entity if suppressed doesn\'t contain value', async () => {
    const context = createContext()

    const resolver: EmptyResolver<Post> = withNestedFilters({
      mapping: {
        'Author.id': true,
      },
      ignore: {
        Post: suppressedBy('Author.id'),
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      throw new Error('Won\'t reach')
    })

    return expect(
      resolver(resultWithPost, {}, context, FAKE_INFO),
    ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post\)\. Suppression for type \(Post\) by type attribute path \(Author\.id\) doesn't contain value in nested arg map\.$/)
  })

  test('withNestedFilters - throw exception for not mapped parent entity if suppressed contains value, but mapping is missing', async () => {
    const context = createContext()

    const resolver: EmptyResolver<Author> = withNestedFilters({
      mapping: {
      },
      ignore: {
        Post: suppressedBy('Author.id'),
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      throw new Error('Won\'t reach')
    })

    return expect(
      resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO),
    ).rejects.toThrow(/^Nested filters has not been mapped for following types \(Post,Author\)\. Suppression for type \(Post\) by type attribute path \(Author\.id\) doesn't exist\.$/)
  })

  test('withNestedFilters - with two parent entities', async () => {
    const context = createContext()

    const resolver: EmptyResolver<Author> = withNestedFilters({
      mapping: {
        'Post.id': true,
        'Author.id': true,
      },
      resultType: 'Comment',
    })(async (parent, args, ctx, info) => {
      expect(args.where).toEqual({
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
    })
    return resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO)
  })
})
