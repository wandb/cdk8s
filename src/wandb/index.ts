import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { WebServiceChart } from './webservice'

export class WeightsAndBaisesChart extends Chart {
  webService: Chart

  constructor(scope: Construct, id: string, props?: ChartProps) {
    super(scope, id, props)

    this.webService = new WebServiceChart(this, `webservice`)
  }
}
