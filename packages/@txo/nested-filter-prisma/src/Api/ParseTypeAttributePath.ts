/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T19:04:73+02:00
 * @Copyright: Technology Studio
**/

import { Type, TypeAttributePath } from '../Model'

export const parseTypeAttributePath = (typeAttributePath: TypeAttributePath): { type: Type, attribute: string } | undefined => {
  const typeAndAttributePair = (typeAttributePath as string).split('.')
  if (typeAndAttributePair.length === 2) {
    const [type, attribute] = typeAndAttributePair as [Type, string]
    return { type, attribute }
  }
}
