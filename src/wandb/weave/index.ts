import { ChartProps } from 'cdk8s'
import { Construct } from 'constructs'
import { WbChart } from '../../common/chart'

type WeaveChartProps = ChartProps & {}

export class WeaveChart extends WbChart {
  constructor(scope: Construct, id: string, props: WeaveChartProps) {
    super(scope, id, props)
  }
}
