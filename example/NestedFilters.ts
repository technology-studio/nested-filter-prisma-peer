/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:93+02:00
 * @Copyright: Technology Studio
**/

import { mapFilter, mapValue, nestedFilter } from '@txo/nested-filter-prisma'
import { Prisma, Comment, Post, Author } from '@prisma/client'

declare module '@txo/nested-filter-prisma' {
  export interface AllNestedFilters {
    Author: {
      structure: Author,
      where: Prisma.AuthorWhereInput,
    },
    Comment: {
      structure: Comment,
      where: Prisma.CommentWhereInput,
    },
    Post: {
      structure: Post,
      where: Prisma.PostWhereInput,
    },
  }
}

export const PostNestedFilter = nestedFilter({
  type: 'Post',
  mapping: {
    Post: {
      id: mapValue('Post.id'),
      deleted: false,
    },
  },
})

export const AuthorNestedFilter = nestedFilter({
  type: 'Author',
  mapping: {
    Author: {
      id: mapValue('Author.id'),
      deleted: false,
    },
  },
})

export const CommentNestedFilter = nestedFilter({
  type: 'Comment',
  mapping: {
    Comment: {
      id: mapValue('Comment.id'),
      deleted: false,
    },
    Post: {
      post: mapFilter('Post'),
    },
  },
})

export const CommentNestedFilterExtended = nestedFilter({
  type: 'Comment',
  mapping: {
    Author: {
      author: mapFilter('Author'),
    },
  },
})

export const nestedFilterList = [
  PostNestedFilter,
  AuthorNestedFilter,
  CommentNestedFilter,
  CommentNestedFilterExtended,
]
