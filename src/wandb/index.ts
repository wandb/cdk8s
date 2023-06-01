import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { logger } from '../logger'

const log = logger.child({ label: 'wandb' })

export class WeightsAndBiases extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    log.info('Creating Weights & Biases deployment')
  }
}
