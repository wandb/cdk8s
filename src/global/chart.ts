import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { config } from '../config'

export class WbChart extends Chart {
  constructor(scope: Construct, id: string, props?: ChartProps) {
    super(scope, id, {
      disableResourceNameHashes: true,
      labels: { app: 'wandb', ...props?.labels },
      namespace: config.namespace,
      ...props,
    })
  }
}
