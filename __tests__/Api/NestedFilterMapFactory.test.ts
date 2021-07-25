/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:81+02:00
 * @Copyright: Technology Studio
**/

import { produceNestedFilterDeclarationMap } from '@txo/nested-filter-prisma'

import { CommentNestedFilter, CommentNestedFilterExtended } from '../../example/NestedFilters'

describe('NestedFilterMapFactory', () => {
  test('produceNestedFilterDeclarationMap - merge two of the same type', () => {
    const nestedFilterList = [
      CommentNestedFilter,
      CommentNestedFilterExtended,
    ]

    const nestedFilterMap = produceNestedFilterDeclarationMap(nestedFilterList)
    expect(nestedFilterMap).toEqual({
      Comment: {
        type: 'Comment',
        mapping: {
          Post: CommentNestedFilterExtended.declaration.mapping.Post,
          Comment: CommentNestedFilter.declaration.mapping.Comment,
        },
      },
    })
  })
})
