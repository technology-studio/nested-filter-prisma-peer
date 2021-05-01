/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:81+02:00
 * @Copyright: Technology Studio
**/

import { produceNestedFilterDeclarationMap } from '@txo/nested-filter-prisma/src'

import { nestedFilterList } from '../../example/NestedFilters'

describe('NestedFilterMapFactory', () => {
  test('produceNestedFilterDeclarationMap - merge two of the same type', () => {
    const nestedFilterMap = produceNestedFilterDeclarationMap(nestedFilterList)
    expect(nestedFilterMap).toEqual({
      Comment: {
        type: 'Comment',
        getPath: undefined,
        mapping: {
          'Author.id': {
            'author.id': true,
          },
          'Post.id': {
            'post.id': true,
          },
        },
      },
    })
  })
})
