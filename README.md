# Nested filter prisma

Nested filters allow automatically filter data resolved for projections based on hierarchy of parent queries or mutations

## Features

* Transitivite relations A → B, B → C ⇒ A → C
* Automatically applied filters by extensions
* Support to extend existing nested filters

## Api reference
* 🍎 TBD 🍎

## Example

#### **`Prisma model`**
```prisma:prisma/schema.prisma
model Post {
  id              String      @default(cuid()) @id
  commentList     Comment[]
}

model Comment {
  id              String      @default(cuid()) @id
  postId          String
  post            Post        @relation(fields: [postId], references: [id])
  authorId        String
  author          Author      @relation(fields: [authorId], references: [id])
}

model Author {
  id              String      @default(cuid()) @id
  commentList     Comment[]
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
import type { NestedFilterMap } from '@txo/nested-filter-prisma'

export type Context = {
  prisma: PrismaClient,
  nestedFilterMap: NestedFilterMap<Context>,
}
```

#### **`Context.ts`**
```typescript:example/Context.ts [7]
import { createNestedFilterMap } from '@txo/nested-filter-prisma/src'
import { PrismaClient } from '@prisma/client'

import type { Context } from './ContextType'
import { nestedFilterList } from './NestedFilters'

export function createContext (): Context {
  return {
    prisma: new PrismaClient({}),
    nestedFilterMap: createNestedFilterMap(nestedFilterList),
  }
}

```

#### **`NestedFilters.ts`**
```typescript:example/NestedFilters.ts [7]
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
```

#### **`Field declaration on Author type`**
```typescript
import { nonNull, extendType } from 'nexus'

import { withNestedFilters } from '@txo/nested-filter-prisma'

export const authorCommentListField = extendType({
  type: 'Author',
  definition: t => {
    t.list.field('commentList', {
      type: 'Comment',
      resolve: withNestedFilters({
        mapping: {
          'Post.id': true,
          'Author.id': true,
        },
        resultType: 'Comment',
      })(async (parent, args, ctx, info) => {
        return ctx.prisma.comment.findMany({
          where: args.where,
        }))
      }),
    })
  },
})
```
