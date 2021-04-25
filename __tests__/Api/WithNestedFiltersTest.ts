/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

import { Author } from '@prisma/client'
import {
  addEntityToNestedArgMap,
  ObjectWithNestedArgMap,
  withNestedFilters,
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
        'Post.id': true,
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

    return expect(
      resolver(resultWithPostAndAuthor, {}, context, FAKE_INFO),
    ).rejects.toThrow('Nested filters has not been mapped for following types (Post)')
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
