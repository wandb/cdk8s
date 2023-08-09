import { EnvValue } from 'cdk8s-plus-26'
import { chain } from 'lodash'

export const envsToValue = (extraEnvs: Record<string, string> = {}) => {
  return chain(extraEnvs)
    .entries()
    .map(([key, value]) => [key.toUpperCase(), EnvValue.fromValue(value)])
    .fromPairs()
    .value()
}
