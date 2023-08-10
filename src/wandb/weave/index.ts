import { ApiObjectMetadata, ChartProps, Duration } from 'cdk8s'
import { Construct } from 'constructs'
import { WbChart } from '../../global/chart'
import {
  Deployment,
  EnvValue,
  ImagePullPolicy,
  Probe,
  Service,
  ServiceType,
} from 'cdk8s-plus-26'
import { envsToValue } from '../../global/extra-envs'

export type WeaveChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
  image?: { repository?: string; tag?: string }
  host?: string
  extraEnvs?: Record<string, string>
}

export class WeaveChart extends WbChart {
  deployment: Deployment
  service: Service

  constructor(scope: Construct, id: string, props: WeaveChartProps) {
    super(scope, id, props)
    const { metadata, image, host, extraEnvs } = props

    const port = 9994
    const repository = image?.repository ?? 'wandb/local'
    const tag = image?.tag ?? 'latest'
    const weaveHelloEndpoint = '__weave/hello'
    const liveness = Probe.fromHttpGet(weaveHelloEndpoint, { port })
    const startup = Probe.fromHttpGet(weaveHelloEndpoint, {
      port,
      failureThreshold: 12,
      periodSeconds: Duration.seconds(10),
    })
    const readiness = Probe.fromHttpGet(weaveHelloEndpoint, { port })

    this.deployment = new Deployment(this, `deployment`, {
      replicas: 1,
      metadata,
      // select: true, // ?? Do we need this.
      containers: [
        {
          image: `${repository}:${tag}`,
          imagePullPolicy: ImagePullPolicy.ALWAYS,
          liveness,
          readiness,
          startup,
          securityContext: {
            ensureNonRoot: false,
            allowPrivilegeEscalation: true,
            readOnlyRootFilesystem: false,
          },

          // resources: {
          //   cpu: {
          //     request: Cpu.millis(500),
          //     limit: Cpu.millis(8000),
          //   },
          //   memory: {
          //     request: Size.mebibytes(1000),
          //     limit: Size.mebibytes(1600),
          //   },
          // },

          envVariables: {
            ONLY_SERVICE: EnvValue.fromValue('weave'),
            WANDB_BASE_URL: EnvValue.fromValue(host ?? ''),
            WEAVE_AUTH_GRAPHQL_URL: EnvValue.fromValue(host + '/graphql'),
            // WEAVE_ENABLE_DATADOG: EnvValue.fromValue('weave'),
            // DD_SERVICE: EnvValue.fromValue('weave'),
            // DD_ENV: EnvValue.fromValue('weave'),
            // DD_PROFILING_ENABLED: EnvValue.fromValue('weave'),
            ...envsToValue(extraEnvs),
          },
        },
      ],
    })

    this.service = new Service(this, `service`, {
      type: ServiceType.CLUSTER_IP,
      metadata,
      selector: this.deployment,
      ports: [{ port: port, targetPort: port }],
    })
  }
}
