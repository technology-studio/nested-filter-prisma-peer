/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-05-02T10:05:27+02:00
 * @Copyright: Technology Studio
**/

export enum NestedFilterDefinitionMode {
  MERGE = 'merge',
  // TODO: later EXTEND = 'extend',
  // TODO: later OVERRIDE = 'override',
}

export enum IgnoreRuleType {
  IGNORED = 'ignored',
  SUPPRESSED_BY = 'suppressed-by',
}

export enum MappingResultMode {
  ASSIGN = 'assign',
  MERGE = 'merge',
  IGNORE = 'ignore',
  INVALID = 'invalid',
}
