# Nested filter prisma

Nested filters allow automatically filter data resolved for projections based on hierarchy of parent queries or mutations

## Features

* Transitivite relations A → B, B → C ⇒ A → C
* Automatically applied filters by extensions
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

#### **`ContextType.ts`**
```typescript:example/ContextType.ts [7]
import type { PrismaClient } from '@prisma/client'
import type { WithNestedFilterContext } from '@txo/nested-filter-prisma/src'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Context<SOURCE=any, ARGS=any> = WithNestedFilterContext<SOURCE, ARGS, {
  prisma: PrismaClient,
}>

```

#### **`Context.ts`**
```typescript:example/Context.ts [7]
import { createNestedFilterMap } from '@txo/nested-filter-prisma/src'
import { PrismaClient } from '@prisma/client'

import type { Context } from './ContextType'
import { nestedFilterList } from './NestedFilters'

export function createContext <SOURCE, ARGS> (): Context<SOURCE, ARGS> {
  return {
    prisma: new PrismaClient({}),
    nestedFilterMap: createNestedFilterMap(nestedFilterList),
    nestedArgMap: {},
    nestedResultMap: {},
    withNestedFilters: async () => {
      throw new Error('nested filter hasn\'t been configured')
    },
  }
}

```

#### **`NestedFilters.ts`**
```typescript:example/NestedFilters.ts [7]
import { mapFilter, mapValue, nestedFilter } from '@txo/nested-filter-prisma/src'
import { Prisma, Comment, Post, Author } from '@prisma/client'

import type { Context } from './ContextType'

declare module '@txo/nested-filter-prisma/src' {
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

export const PostNestedFilter = nestedFilter<Context, 'Post'>({
  type: 'Post',
  mapping: {
    Post: {
      id: mapValue('Post.id'),
      deleted: false,
    },
  },
})

export const AuthorNestedFilter = nestedFilter<Context, 'Author'>({
  type: 'Author',
  mapping: {
    Author: {
      id: mapValue('Author.id'),
      deleted: false,
    },
  },
})

export const CommentNestedFilter = nestedFilter<Context, 'Comment'>({
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

export const CommentNestedFilterExtended = nestedFilter<Context, 'Comment'>({
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
          where: ctx.withNestedFilters<'Comment'>({
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
