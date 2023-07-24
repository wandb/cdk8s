import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import { WbChart } from '../global/chart'
import { Construct } from 'constructs'
import { Deployment, Probe, Service, ServiceType } from 'cdk8s-plus-26'
import { REDIS_DEFAULT_REPOSITORY, REDIS_DEFAULT_TAG } from './helpers'
import { RedisCredentialsConfig, RedisManagedConfig } from './config'

type RedisChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
} & RedisManagedConfig

export class RedisChart extends WbChart {
  service: Service
  constructor(scope: Construct, id: string, props: RedisChartProps) {
    super(scope, id, props)

    const { metadata } = props

    const ping = Probe.fromCommand(['sh', '-c', 'redis-cli ping'])
    const repository = REDIS_DEFAULT_REPOSITORY
    const tag = REDIS_DEFAULT_TAG

    const deployment = new Deployment(this, 'redis', {
      metadata,
      replicas: 1,
      containers: [
        {
          image: `${repository}:${tag}`,
          liveness: ping,
          readiness: ping,
          securityContext: {
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },
          ports: [{ number: 6379 }],
        },
      ],
    })

    this.service = new Service(this, 'service', {
      metadata,
      type: ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [{ port: 6379 }],
    })
  }

  getCredentials(): RedisCredentialsConfig {
    return {
      host: this.service.name,
      port: 6379,
      params: {},
    }
  }
}
