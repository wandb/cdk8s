import { Deployment } from 'cdk8s-plus-26'
import { Construct } from 'constructs'

export class WeightsAndBiasesLocalDeployment extends Deployment {
  constructor(scope: Construct, config: {}) {
    const id = 'local'
    super(scope, id, {
      initContainers: [],
      containers: [],
    })
  }
}
