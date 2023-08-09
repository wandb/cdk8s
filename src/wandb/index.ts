import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { AppChart, AppChartProps } from './app'
import { WeaveChart } from './weave'
import { merge } from 'lodash'
import { WbChart } from '../global/chart'
import { GeneralConfig } from '../global/global'
import { IngressChart } from './ingress'
import { ConsoleChart, ConsoleChartProps } from './console'

type WeightsAndBiasesChartConfig = ChartProps & {
  global: GeneralConfig
  app: AppChartProps
  console?: ConsoleChartProps
  ingress?: {
    defaultBackend?: 'app' | 'console'
    metadata?: ApiObjectMetadata
  }
}

export class WeightsAndBiasesChart extends WbChart {
  app: AppChart
  weave: WeaveChart
  console: ConsoleChart

  constructor(
    scope: Construct,
    id: string,
    props: WeightsAndBiasesChartConfig,
  ) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    const { global, app, ingress, console } = props

    this.app = new AppChart(this, `app`, {
      ...props,
      ...app,
      metadata: merge(global.metadata, app.metadata),
      extraEnvs: merge(global.extraEnvs, app.extraEnvs),
    })
    this.weave = new WeaveChart(this, `weave`, props)
    this.console = new ConsoleChart(this, `console`, {
      ...props,
      ...console,
      metadata: merge(global.metadata, console?.metadata),
    })

    new IngressChart(this, `ingress`, {
      ...props,
      ...ingress,
      metadata: merge(global.metadata, ingress?.metadata),
      console: this.console.service,
      app: this.app.service,
    })
  }
}
