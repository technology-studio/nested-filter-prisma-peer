/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T18:04:64+02:00
 * @Copyright: Technology Studio
**/

import type { Post, Author } from '@prisma/client'
export const POST: Post = {
  id: 'post.id.1',
  description: 'Lorem ipsum',
}

export const AUTHOR: Author = {
  id: 'author.id.1',
  firstName: 'John',
  lastName: 'Smith',
}
