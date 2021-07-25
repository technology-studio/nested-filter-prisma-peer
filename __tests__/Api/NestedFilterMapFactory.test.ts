/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:81+02:00
 * @Copyright: Technology Studio
**/

import {
  produceNestedFilterDeclarationMap,
  mapValue,
  nestedFilter,
  traverseNestedFilterCollection,
} from '@txo/nested-filter-prisma'

import { CommentNestedFilter, CommentNestedFilterExtended } from '../../example/NestedFilters'

describe('NestedFilterMapFactory', () => {
  test('traverseNestedFilterCollection - traverse nested collections and visit each filter only once', () => {
    const collection = [[
      CommentNestedFilter,
      CommentNestedFilterExtended,
    ]]
    const callback = jest
      .fn(() => undefined)

    traverseNestedFilterCollection(collection, callback)
    expect(callback.mock.calls).toEqual([[CommentNestedFilter], [CommentNestedFilterExtended]])
  })

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

  test('produceNestedFilterDeclarationMap - merge two of the same type with the same mapped type', () => {
    const NestedFilter1 = nestedFilter({
      type: 'Comment',
      mapping: {
        Post: mapValue('Post.id'),
      },
    })

    const NestedFilter2 = nestedFilter({
      type: 'Comment',
      mapping: {
        Post: mapValue('Post.id'),
      },
    })

    const collection = [NestedFilter1, NestedFilter2]

    const nestedFilterMap = produceNestedFilterDeclarationMap(collection)
    expect(nestedFilterMap).toEqual({
      Comment: {
        type: 'Comment',
        mapping: {
          Post: NestedFilter2.declaration.mapping.Post,
        },
      },
    })
  })
})
