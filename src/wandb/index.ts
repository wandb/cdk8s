import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { WebServiceChart } from './webservice'
import { WeaveChart } from './weave'

export class WeightsAndBaisesChart extends Chart {
  webService: Chart
  weave: Chart

  constructor(scope: Construct, id: string, props?: ChartProps) {
    super(scope, id, props)

    this.webService = new WebServiceChart(this, `webservice`, props)
    this.weave = new WeaveChart(this, `weave`)
  }
}
