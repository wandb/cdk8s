import {
  Deployment,
  EnvValue,
  Probe,
  Service,
  ServiceType,
} from 'cdk8s-plus-26'
import { WbChart } from '../../global/chart'
import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import { Construct } from 'constructs'

export type ConsoleChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
  image?: { repository?: string; tag?: string }
  name?: string
  namespace?: string
}

export class ConsoleChart extends WbChart {
  service: Service
  constructor(scope: Construct, id: string, props: ConsoleChartProps) {
    super(scope, id, props)
    const { image, metadata } = props
    const port = 8081
    const liveness = Probe.fromHttpGet('/healthy', { port })
    const readiness = Probe.fromHttpGet('/ready', { port })

    const repository = image?.repository ?? 'wandb/console'
    const tag = image?.tag ?? 'latest'

    const deployment = new Deployment(this, `console`, {
      metadata,
      replicas: 1,
      containers: [
        {
          image: `${repository}:${tag}`,
          liveness,
          readiness,
          securityContext: {
            ensureNonRoot: false,
            allowPrivilegeEscalation: true,
            readOnlyRootFilesystem: false,
          },
          envVariables: {
            OPERATOR_NAME: EnvValue.fromValue(props.name ?? 'wandb'),
            OPERATOR_NAMESPACE: EnvValue.fromValue(
              props.namespace ?? 'default',
            ),
          },
        },
      ],
    })

    this.service = new Service(this, `service`, {
      metadata,
      type: ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [{ name: 'app', port: 8081 }],
    })
  }
}
