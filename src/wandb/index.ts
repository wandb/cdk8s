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
  ingress?: {
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

    const { global, app, ingress } = props

    this.app = new AppChart(this, `webservice`, {
      ...props,
      ...app,
      metadata: merge(global.metadata, app.metadata),
    })
    this.weave = new WeaveChart(this, `weave`, props)

    new IngressChart(this, `ingress`, {
      metadata: merge(global.metadata, ingress?.metadata ?? {}),
      consoleService: {
        name: 'console-service',
        namespace: 'wandb',
      },
      app: this.app.service,
    })
  }
}
