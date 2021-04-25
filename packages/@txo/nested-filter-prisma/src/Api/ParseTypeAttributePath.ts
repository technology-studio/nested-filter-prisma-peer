/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T19:04:73+02:00
 * @Copyright: Technology Studio
**/

export const parseTypeAttributePath = (typeAttributePath: string): { type: string, attribute: string } | undefined => {
  const typeAndAttributePair = typeAttributePath.split('.')
  if (typeAndAttributePair.length === 2) {
    const [type, attribute] = typeAndAttributePair
    return { type, attribute }
  }
}
