/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-18T09:04:48+02:00
 * @Copyright: Technology Studio
**/

import type { Prisma } from '@prisma/client'

export const addEntityToNestedArgMap = <RESULT>(
  result: RESULT,
  nestedArgMap: Record<string, unknown> | undefined,
  resultType: Prisma.ModelName,
): RESULT & { nestedArgMap: Record<string, unknown> } => {
  return {
    ...result,
    nestedArgMap: {
      ...nestedArgMap,
      [resultType]: {
        ...result,
      },
      // NOTE: maybe we don't need to spread nestedArg here, let's observe if we need it then remove or keep
      parent: nestedArgMap,
    },
  }
}
