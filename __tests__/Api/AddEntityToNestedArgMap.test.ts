/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:81+02:00
 * @Copyright: Technology Studio
**/

import { addEntityToNestedArgMap } from '@txo/nested-filter-prisma/src'

import { POST, AUTHOR } from '../Data'

describe('AddEntityToNestedArgMapTest', () => {
  test('addEntityToNestedArgMap - does not mutate result', () => {
    const result = { ...POST }
    const resultWithNestedArgMap = addEntityToNestedArgMap(result, undefined, 'Post')
    expect(resultWithNestedArgMap).not.toBe(result)
    expect(result).toEqual(POST)
  })

  test('addEntityToNestedArgMap - add initial value to object', () => {
    const result = addEntityToNestedArgMap(POST, undefined, 'Post')

    expect(result).toEqual({
      ...POST,
      nestedArgMap: {
        Post: POST,
      },
    })
  })

  test('addEntityToNestedArgMap - add to existing containing nestedArgMap', () => {
    const nestedArgMap = { Post: POST }
    const result = addEntityToNestedArgMap(AUTHOR, nestedArgMap, 'Author')

    console.log('POST', POST)
    expect(result).toEqual({
      ...AUTHOR,
      nestedArgMap: {
        Post: POST,
        Author: AUTHOR,
        parent: nestedArgMap,
      },
    })
    expect(result.nestedArgMap.parent).toBe(nestedArgMap)
  })
})
