import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { logger } from '../../logger'
import { WeightsAndBiasesLocalDeployment as WebServiceDeployment } from './deployment'
import { ImageConfig } from '../../configs/images'
import { MysqlAuthConfig } from '../../mysql/config'
import { WebServiceService } from './service'

const log = logger.child({ label: 'webservice' })

export type WebServiceConfig = {
  image: ImageConfig
  database: MysqlAuthConfig
} & ChartProps

export class WebService extends Chart {
  constructor(scope: Construct, id: string, props: WebServiceConfig) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    new WebServiceDeployment(this, props)
    new WebServiceService()
  }
}
