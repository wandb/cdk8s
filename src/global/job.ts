import { Job, JobProps } from 'cdk8s-plus-26'
import { Construct } from 'constructs'

function hashCode(str: string) {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export class RecreateJob extends Job {
  constructor(scope: Construct, id: string, props: JobProps | undefined) {
    const p = JSON.stringify(props)
    super(scope, `${id}-${hashCode(p)}`, props)
  }
}
