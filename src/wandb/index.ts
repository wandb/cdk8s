import { ApiObjectMetadata, Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { WebServiceChart, WebServiceChartProps } from './webservice'
import { WeaveChart } from './weave'
import { merge } from 'lodash'
import { WbChart } from '../common/chart'

type WeightsAndBaisesChartConfig = ChartProps & {
  metadata: ApiObjectMetadata
  webservices: WebServiceChartProps
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

    const { metadata, webservices } = props
    this.webService = new WebServiceChart(this, `webservice`, {
      ...props,
      ...webservices,
      metadata: merge(metadata, webservices.metadata),
    })
    this.weave = new WeaveChart(this, `weave`, props)
  }
}
