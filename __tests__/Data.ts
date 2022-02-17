/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T18:04:64+02:00
 * @Copyright: Technology Studio
**/

import type { Post, Author, Comment } from '@prisma/client'
import { NestedResultNode } from '@txo/nested-filter-prisma'
import type { Context } from '@txo/prisma-graphql'
import { GraphQLObjectType, GraphQLList, GraphQLResolveInfo, GraphQLString } from 'graphql'

const cloneAndAddResult = (node: NestedResultNode, pathList: string[], resultNode: NestedResultNode): NestedResultNode => {
  if (pathList.length > 1) {
    const [key, ...restPathList] = pathList
    const childNode: NestedResultNode = node.children[key] ?? { children: {} }
    return {
      ...node,
      children: {
        ...node.children,
        [key]: cloneAndAddResult(
          childNode,
          restPathList,
          resultNode,
        ),
      },
    }
  }
  const [key] = pathList
  return {
    ...node,
    children: {
      ...node.children,
      [key]: resultNode,
    },
  }
}

export const SOME_TEXT = 'Some text'

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

export const LEVEL_0_RESULT_NODE = {
  children: {},
  nestedArgMap: {},
  childrenNestedArgMap: {},
}

export const LEVEL_1_COMMENT_LIST_INFO = {
  fieldName: 'commentList',
  path: { prev: LEVEL_0_POST_INFO.path, key: 'commentList', typename: 'Post' },
  parentType: LEVEL_0_POST_INFO.returnType,
  returnType: new GraphQLList(new GraphQLObjectType({
    name: 'Comment',
    fields: {},
  })),
} as unknown as GraphQLResolveInfo

export const LEVEL_1_ID_INFO = {
  fieldName: 'id',
  path: { prev: LEVEL_0_POST_INFO.path, key: 'id', typename: 'Post' },
  parentType: LEVEL_0_POST_INFO.returnType,
  returnType: GraphQLString,
} as unknown as GraphQLResolveInfo

export const LEVEL_1_POST_NESTED_ARG_MAP = {
  Post: POST,
}

export const LEVEL_1_POST_NESTED_RESULT_NODE: NestedResultNode = cloneAndAddResult(
  LEVEL_0_RESULT_NODE,
  ['post'],
  {
    type: 'Post',
    result: POST,
    children: {},
    nestedArgMap: {},
    childrenNestedArgMap: {},
  },
)

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

export const LEVEL_2_POST_COMMENT_NESTED_RESULT_NODE = cloneAndAddResult(
  LEVEL_1_POST_NESTED_RESULT_NODE,
  ['post', 'commentList', '0'],
  {
    type: 'Comment',
    result: COMMENT_1,
    children: {},
    nestedArgMap: {},
    childrenNestedArgMap: {},
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

export const LEVEL_3_POST_COMMENT_AUTHOR_NESTED_RESULT_NODE = cloneAndAddResult(
  LEVEL_2_POST_COMMENT_NESTED_RESULT_NODE,
  ['post', 'commentList', '0', 'author'],
  {
    type: 'Author',
    result: AUTHOR,
    children: {},
    nestedArgMap: {},
    childrenNestedArgMap: {},
  },
)
