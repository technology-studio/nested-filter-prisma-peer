/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2022-05-08T14:05:89+02:00
 * @Copyright: Technology Studio
**/

import type { GetStructure, NestedResultNode, ReplaceNestedResultAttributes, Type } from '../Model/Types'
import type { Context } from '@txo/prisma-graphql'

const replaceNestedResult = <TYPE extends Type>(
  { nestedArgMap, childrenNestedArgMap, children }: NestedResultNode,
  type: TYPE,
  result: GetStructure<TYPE>,
): void => {
  for (const _type in nestedArgMap) {
    if (_type === type) {
      nestedArgMap[_type as Type] = result
    }
  }

  for (const _type in childrenNestedArgMap) {
    if (_type === type) {
      childrenNestedArgMap[_type as Type] = result
    }
  }

  for (const path in children) {
    replaceNestedResult(children[path], type, result)
  }
}

export const replaceNestedResultFactory = (context: Context) => <TYPE extends Type>({ type, result }: ReplaceNestedResultAttributes<TYPE>): void => {
  replaceNestedResult(context.rootNestedResultNode, type, result)
  if (type in context.nestedArgMap) {
    context.nestedArgMap[type] = result
  }
}
