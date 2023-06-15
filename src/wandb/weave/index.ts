import { Chart, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'

type WeaveChartProps = ChartProps & {}

export class WeaveChart extends Chart {
  constructor(scope: Construct, id: string, props: WeaveChartProps) {
    super(scope, id, props)
  }
}
