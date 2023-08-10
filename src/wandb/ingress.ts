import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import {
  HttpIngressPathType,
  Ingress,
  IngressBackend,
  Service,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { WbChart } from '../global/chart'

type IngressChartProps = ChartProps & {
  defaultBackend?: 'app' | 'console'
  metadata?: ApiObjectMetadata
  console: Service
  app: Service
}

export class IngressChart extends WbChart {
  constructor(scope: Construct, id: string, props: IngressChartProps) {
    super(scope, id, props)

    const { app, metadata, defaultBackend, console } = props

    const consoleBackend = IngressBackend.fromService(console)
    const appBackend = IngressBackend.fromService(app)

    new Ingress(this, `ingress`, {
      metadata,
      defaultBackend:
        defaultBackend === 'console' ? consoleBackend : appBackend,
      rules: [
        {
          path: '/console',
          backend: consoleBackend,
          pathType: HttpIngressPathType.PREFIX,
        },
      ],
    })
  }
}
