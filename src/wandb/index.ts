import { ApiObjectMetadata, Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { AppChart, AppChartProps } from './app'
import { WeaveChart } from './weave'
import { merge } from 'lodash'
import { WbChart } from '../global/chart'
import { GeneralConfig } from '../global/global'
import { IngressChart } from './ingress'

type WeightsAndBaisesChartConfig = ChartProps & {
  global: GeneralConfig
  app: AppChartProps
  console?: {
    name?: string
    namespace?: string
  }
  ingress?: {
    defaultBackend?: 'app' | 'console'
    metadata?: ApiObjectMetadata
  }
}

export class WeightsAndBaisesChart extends WbChart {
  app: AppChart
  weave: Chart

  constructor(
    scope: Construct,
    id: string,
    props: WeightsAndBaisesChartConfig,
  ) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    const { global, app, ingress, console } = props

    this.app = new AppChart(this, `app`, {
      ...props,
      ...app,
      metadata: merge(global.metadata, app.metadata),
    })
    this.weave = new WeaveChart(this, `weave`, props)

    new IngressChart(this, `ingress`, {
      metadata: merge(global.metadata, ingress?.metadata ?? {}),
      ...ingress,
      console: {
        name: console?.name ?? 'console-service',
        namespace: console?.namespace ?? 'wandb',
      },
      app: this.app.service,
    })
  }
}
