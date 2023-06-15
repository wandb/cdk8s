import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { WebServiceChart, WebServiceChartProps } from './webservice'
import { WeaveChart } from './weave'

type WeightsAndBaisesChartConfig = ChartProps & {
  webservices: WebServiceChartProps
}

export class WeightsAndBaisesChart extends Chart {
  webService: Chart
  weave: Chart

  constructor(
    scope: Construct,
    id: string,
    props: WeightsAndBaisesChartConfig,
  ) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    this.webService = new WebServiceChart(this, `webservice`, props.webservices)
    this.weave = new WeaveChart(this, `weave`, props)
  }
}
