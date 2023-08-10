import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { AppChart, AppChartProps } from './app'
import { WeaveChart } from './weave'
import { merge } from 'lodash'
import { WbChart } from '../global/chart'
import { GeneralConfig } from '../global/global'
import { IngressChart } from './ingress'
import { ConsoleChart, ConsoleChartProps } from './console'
import { WeaveChartProps } from './weave'

type WeightsAndBiasesChartConfig = ChartProps & {
  global: GeneralConfig
  app: AppChartProps
  console?: Omit<ConsoleChartProps, 'app'>
  weave?: WeaveChartProps
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

    const { global, app, ingress, console, weave } = props

    this.weave = new WeaveChart(this, `weave`, {
      ...props,
      host: app?.host,
      image: app?.image,
      metadata: merge(global.metadata, weave?.metadata),
      extraEnvs: merge(global.extraEnvs, weave?.extraEnvs),
    })
    this.app = new AppChart(this, `app`, {
      ...props,
      ...app,
      metadata: merge(global.metadata, app.metadata),
      extraEnvs: merge(global.extraEnvs, app?.extraEnvs),
      weave: this.weave.service,
    })
    this.console = new ConsoleChart(this, `console`, {
      ...props,
      ...console,
      app: this.app.service,
      metadata: merge(global.metadata, console?.metadata),
      extraEnvs: merge(global.extraEnvs, console?.extraEnvs),
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
