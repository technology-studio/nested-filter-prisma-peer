# Nested filter prisma

Nested filters allow automatically filter data resolved for projections based on hierarchy of parent queries or mutations

## Features

* Transitivite relations A → B, B → C ⇒ A → C
* Automatically applied filters by plugins
* Support to extend existing nested filters
* Validation of not mapped parent entities with support of ignore rules.

## Api reference
* 🍎 TBD 🍎

## Example

#### **`Prisma model`**
```prisma:prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
  // previewFeatures = []
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id          String    @id @default(cuid())
  deleted     Boolean   @default(false)
  description String
  commentList Comment[]
}

model Comment {
  id       String  @id @default(cuid())
  deleted  Boolean @default(false)
  text     String
  postId   String
  post     Post    @relation(fields: [postId], references: [id])
  authorId String
  author   Author  @relation(fields: [authorId], references: [id])
}

model Author {
  id          String    @id @default(cuid())
  deleted     Boolean   @default(false)
  firstName   String
  lastName    String
  commentList Comment[]
}

```

#### **`Query`**
```graphql
query {
  post {
    id
    commentList {       # let's asume this list should return comments that belong to post above
      id
      author {
        id
        commentList {   # let's assume that this list shourd return only comments that belong to post and author above
          id
        }
      }
    }
  }
}
```

#### **`Context.ts`**
```typescript:example/Context.ts [7]
import { createNestedFilterMap } from '@txo/nested-filter-prisma'
import { PrismaClient } from '@prisma/client'
import type { Context } from '@txo/prisma-graphql'

import { nestedFilterList } from './NestedFilters'

export function createContext (): Context {
  return {
    prisma: new PrismaClient({}),
    nestedFilterMap: createNestedFilterMap(nestedFilterList),
    nestedArgMap: {},
    nestedResultMap: {},
    withNestedFilters: async () => {
      throw new Error('nested filter hasn\'t been configured')
    },
    request: {
      headers: {},
    },
  }
}

export const context = createContext()

```

#### **`NestedFilters.ts`**
```typescript:example/NestedFilters.ts [7]
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
  },
})

export const CommentNestedFilterExtended = nestedFilter({
  type: 'Comment',
  mapping: {
    Post: {
      post: mapFilter('Post'),
    },
  },
})

export const nestedFilterList = [
  PostNestedFilter,
  AuthorNestedFilter,
  CommentNestedFilter,
  CommentNestedFilterExtended,
]

```

#### **`Using nestedFilters on field declaration on Author type`**
```typescript
import { nonNull, extendType } from 'nexus'

import { mapFilter, ignored } from '@txo/nested-filter-prisma'

export const authorCommentListField = extendType({
  type: 'Author',
  definition: t => {
    t.list.field('commentList', {
      type: 'Comment',
      resolve: async (parent, args, ctx, info) => {
        return ctx.prisma.comment.findMany({
          where: ctx.withNestedFilters({
            type: 'Comment',
            mapping: {
              Post: { post: mapFilter('Post') },
              Comment: ignored(),
              Author: { author: mapFilter('Author') },
            },
          })
        })
      }),
    })
  },
})
```
