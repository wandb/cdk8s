import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { WebServiceChart, WebServiceChartProps } from './webservice'
import { WeaveChart } from './weave'
import { merge } from 'lodash'
import { WbChart } from '../global/chart'
import { GeneralConfig } from '../global/global'

type WeightsAndBaisesChartConfig = ChartProps & {
  global: GeneralConfig
  webServices: WebServiceChartProps
}

export class WeightsAndBaisesChart extends WbChart {
  webService: Chart
  weave: Chart

  constructor(
    scope: Construct,
    id: string,
    props: WeightsAndBaisesChartConfig,
  ) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    const { global, webServices } = props
    this.webService = new WebServiceChart(this, `webservice`, {
      ...props,
      ...webServices,
      metadata: merge(global.metadata, webServices.metadata),
    })
    this.weave = new WeaveChart(this, `weave`, props)
  }
}
