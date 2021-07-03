/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T18:04:64+02:00
 * @Copyright: Technology Studio
**/

import type { Post, Author, Comment } from '@prisma/client'
import { NestedResultMap, NestedResultNode } from '@txo/nested-filter-prisma/src'
import { GraphQLObjectType, GraphQLList, GraphQLResolveInfo } from 'graphql'

import type { Context } from '../example/ContextType'

const cloneAndAddResult = (map: NestedResultMap, pathList: string[], resultNode: NestedResultNode): NestedResultMap => {
  if (pathList.length > 1) {
    const [key, ...restPathList] = pathList
    const node = map[key] ?? { children: {} }
    return {
      ...map,
      [key]: {
        ...node,
        children: cloneAndAddResult(
          node.children,
          restPathList,
          resultNode,
        ),
      },
    }
  }
  const [key] = pathList
  return {
    ...map,
    [key]: resultNode,
  }
}

export const POST: Post = {
  id: 'post.id.1',
  description: 'Lorem ipsum',
  deleted: false,
}

export const AUTHOR: Author = {
  id: 'author.id.1',
  firstName: 'John',
  lastName: 'Smith',
  deleted: false,
}

export const COMMENT_1: Comment = {
  id: 'comment.id.1',
  authorId: AUTHOR.id,
  postId: POST.id,
  text: 'Lorem ipsum dolor sit amet',
  deleted: false,
}
export const COMMENT_2: Comment = {
  id: 'comment.id.2',
  authorId: AUTHOR.id,
  postId: POST.id,
  text: 'Lorem ipsum dolor sit amet',
  deleted: false,
}

export type EmptyResolver<SOURCE> = (
  source: SOURCE,
  args: { where?: unknown },
  context: Context,
  info: GraphQLResolveInfo
) => Promise<void>

export const LEVEL_0_POST_INFO = {
  fieldName: 'post',
  path: { prev: undefined, key: 'post', typename: 'Query' },
  parentType: new GraphQLObjectType({
    name: 'Query',
    fields: {},
  }),
  returnType: new GraphQLObjectType({
    name: 'Post',
    fields: {},
  }),
} as unknown as GraphQLResolveInfo

export const LEVEL_0_RESULT_MAP = {}

export const LEVEL_1_COMMENT_LIST_INFO = {
  fieldName: 'commentList',
  path: { prev: LEVEL_0_POST_INFO.path, key: 'commentList', typename: 'Post' },
  parentType: LEVEL_0_POST_INFO.returnType,
  returnType: new GraphQLList(new GraphQLObjectType({
    name: 'Comment',
    fields: {},
  })),
} as unknown as GraphQLResolveInfo

export const LEVEL_1_POST_NESTED_ARG_MAP = {
  Post: POST,
}

export const LEVEL_1_POST_NESTED_RESULT_MAP: NestedResultMap = {
  post: {
    type: 'Post',
    result: POST,
    children: {},
  },
}

export const LEVEL_2_AUTHOR_INFO = {
  fieldName: 'author',
  path: { prev: { prev: LEVEL_1_COMMENT_LIST_INFO.path, key: 0 }, key: 'author', typename: 'Comment' },
  parentType: LEVEL_1_COMMENT_LIST_INFO.returnType,
  returnType: new GraphQLObjectType({
    name: 'Author',
    fields: {},
  }),
} as unknown as GraphQLResolveInfo

export const LEVEL_2_POST_COMMENT_NESTED_ARG_MAP = {
  Post: POST,
  Comment: COMMENT_1,
}

export const LEVEL_2_POST_COMMENT_NESTED_RESULT_MAP = cloneAndAddResult(
  LEVEL_1_POST_NESTED_RESULT_MAP,
  ['post', 'commentList', '0'],
  {
    type: 'Comment',
    result: COMMENT_1,
    children: {},
  },
)

export const LEVEL_3_COMMENT_LIST_INFO = {
  fieldName: 'commentList',
  path: { prev: LEVEL_2_AUTHOR_INFO.path, key: 'commentList', typename: 'Author' },
  parentType: LEVEL_2_AUTHOR_INFO.returnType,
  returnType: new GraphQLList(new GraphQLObjectType({
    name: 'Comment',
    fields: {},
  })),
} as unknown as GraphQLResolveInfo

export const LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_MAP = cloneAndAddResult(
  LEVEL_2_POST_COMMENT_NESTED_RESULT_MAP,
  ['post', 'commentList', '0', 'author'],
  {
    type: 'Author',
    result: AUTHOR,
    children: {},
  },
)
