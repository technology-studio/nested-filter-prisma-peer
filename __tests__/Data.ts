/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T18:04:64+02:00
 * @Copyright: Technology Studio
**/

import type { Post, Author, Comment } from '@prisma/client'
import { GraphQLObjectType, GraphQLResolveInfo } from 'graphql'
import { ObjectWithNestedArgMap } from '@txo/nested-filter-prisma/src'

import type { Context } from '../example/ContextType'

export const POST: Post = {
  id: 'post.id.1',
  description: 'Lorem ipsum',
}

export const AUTHOR: Author = {
  id: 'author.id.1',
  firstName: 'John',
  lastName: 'Smith',
}

export const COMMENT: Comment = {
  id: 'comment.id.1',
  authorId: AUTHOR.id,
  postId: POST.id,
  text: 'Lorem ipsum dolor sit amet',
}

export type EmptyResolver<SOURCE = ObjectWithNestedArgMap> = (
  source: SOURCE,
  args: { where?: unknown },
  context: Context,
  info: GraphQLResolveInfo
) => Promise<void>

export const FAKE_INFO = null as unknown as GraphQLResolveInfo

export const FAKE_ROOT_INFO = {
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
