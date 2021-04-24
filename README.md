# Nested filter prisma #

Nested filter prisma

Nested filters allow automatically filter data resolved for projections based on hierarchy of parent queries or mutations

#### **`Prisma model`**
```prisma
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

#### **`Types/Context.ts`**
```typescript
import type { PrismaClient } from '@prisma/client'
import type { NestedFilterMap } from '@txo/nested-filter-prisma'

export type Context = {
  prisma: PrismaClient,
  nestedFilterMap: NestedFilterMap<Context>,
}
```

#### **`context.ts`**
```typescript
import { createNestedFilterMap } from '@txo/nested-filter-prisma'
import type { PrismaClient } from '@prisma/client'

import type { Context } from './Types/ContextType'
import { nestedFilterList } from './NestedFilters'

export function createContext (): Context {
  return {
    prisma: new PrismaClient({}}),
    nestedFilterMap: createNestedFilterMap(nestedFilterList),
  }
}
```

#### **`NestedFilters.ts`**
```typescript
import { nestedFilter } from from '@txo/nested-filter-prisma'

import type { Context } from './Types/ContextType'

export const CommentNestedFilter = nestedFilter<Context>({
  type: 'Comment',
  map: {
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

import { withNestedFilters } from from '@txo/nested-filter-prisma'

export const authorCommentListField = extendType({
  type: 'Author',
  definition: t => {
    t.list.field('commentList', {
      type: 'Comment',
      resolve: withNestedFilters({
        map: {
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
