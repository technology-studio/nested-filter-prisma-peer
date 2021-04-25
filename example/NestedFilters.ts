/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:93+02:00
 * @Copyright: Technology Studio
**/

import { nestedFilter } from '@txo/nested-filter-prisma/src'

import type { Context } from './ContextType'

export const CommentNestedFilter = nestedFilter<Context>({
  type: 'Comment',
  mapping: {
    'Post.id': 'post.id',
    'Author.id': 'author.id',
  },
})

export const nestedFilterList = [
  CommentNestedFilter,
]
