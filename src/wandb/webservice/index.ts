import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import {
  Deployment,
  EnvValue,
  Probe,
  Secret,
  Service,
  ServiceType,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import {
  BucketConfig,
  LicenseConfig,
  SsoConfig,
  bucketConfigToEnv,
  ssoConfigToEnv,
} from './config'
import { MysqlCredentialsConfig } from '../../mysql'
import { WbChart } from '../../global/chart'
import { RedisCredentialsConfig } from '../../redis/config'
import { canConnectToDatabase, mysqlConfigToEnv } from '../../mysql/helpers'
import { canConnectToRedis, redisConfigToEnv } from '../../redis/helpers'

export type WebServiceChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
  image?: { repository?: string; tag?: string }
  mysql: MysqlCredentialsConfig
  bucket: BucketConfig
  redis: RedisCredentialsConfig
  sso?: SsoConfig
  license?: LicenseConfig
}

export class WebServiceChart extends WbChart {
  deployment: Deployment

  constructor(scope: Construct, id: string, props: WebServiceChartProps) {
    super(scope, id, props)
    const { mysql, redis, sso, bucket, image, metadata } = props

    const port = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port })
    const startup = Probe.fromHttpGet('/ready', { port, failureThreshold: 120 })
    const readiness = Probe.fromHttpGet('/ready', { port })

    const repository = image?.repository ?? 'wandb/local'
    const tag = image?.tag ?? '0.30.0'
    this.deployment = new Deployment(this, `local`, {
      replicas: 1,
      metadata,
      podMetadata: {
        annotations: {
          'checksum/mysql-password':
            typeof mysql.password != 'string'
              ? mysql.password.checksum ?? ''
              : '',
        },
      },
      initContainers: [
        canConnectToDatabase(this, `${repository}:${tag}`, mysql),
        canConnectToRedis(this, redis),
      ],
      containers: [
        {
          image: `${repository}:${tag}`,
          liveness,
          readiness,
          startup,
          securityContext: {
            ensureNonRoot: false,
            allowPrivilegeEscalation: true,
            readOnlyRootFilesystem: false,
          },
          envVariables: {
            ...redisConfigToEnv(this, 'deployment-redis', redis),
            ...mysqlConfigToEnv(this, 'deployment-mysql', mysql),
            ...bucketConfigToEnv(this, 'deployment-s3', bucket),
            ...(sso != null ? ssoConfigToEnv(sso) : {}),
            LICENSE:
              props.license == null || typeof props.license === 'string'
                ? EnvValue.fromValue(props.license ?? '')
                : EnvValue.fromSecretValue({
                    secret: Secret.fromSecretName(
                      scope,
                      `${scope.node.id}-${id}-mysql-password`,
                      props.license.secret,
                    ),
                    key: props.license.key,
                  }),
            BUCKET_QUEUE: EnvValue.fromValue('internal://'),
          },
        },
      ],
    })

    new Service(this, `api`, {
      type: ServiceType.CLUSTER_IP,
      metadata,
      selector: this.deployment,
      ports: [{ name: 'http', port }],
    })

    new Service(this, `prometheus`, {
      type: ServiceType.CLUSTER_IP,
      metadata,
      selector: this.deployment,
      ports: [{ name: 'prometheus', port: 8181 }],
    })
  }
}
