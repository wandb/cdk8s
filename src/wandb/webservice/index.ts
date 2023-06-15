import { Chart, ChartProps } from 'cdk8s'
import {
  ContainerProps,
  Deployment,
  Probe,
  Service,
  ServiceType,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { mysqlConfigToEnv } from '../../mysql/helpers'
import { config } from '../../config'
import {
  BucketConfig,
  SsoConfig,
  bucketConfigToEnv,
  ssoConfigToEnv,
} from './config'
import { MysqlCredentialsConfig } from '../../mysql'

const canConnectToDatabase = (
  scope: Construct,
  image: string,
  config: MysqlCredentialsConfig,
): ContainerProps => {
  return {
    name: 'check-db',
    image,
    envVariables: { ...mysqlConfigToEnv(scope, 'init-check', config) },
    command: [
      'bash',
      '-c',
      'until mysql -h$DATABASE_HOST -p$DATABASE_PORT -u$DATABASE_USER -p$DATABASE_PASSWORD -D$DATABASE --execute="SELECT 1"; do echo waiting for db; sleep 2; done',
    ],
  }
}

export type WebServiceChartProps = ChartProps & {
  image?: { repository?: string; tag?: string }
  mysql: MysqlCredentialsConfig
  bucket: BucketConfig
  sso?: SsoConfig
}

export class WebServiceChart extends Chart {
  deployment: Deployment
  service: Service
  prometheus: Service

  constructor(scope: Construct, id: string, props: WebServiceChartProps) {
    super(scope, id, props)
    const { common } = config
    const { mysql, sso, bucket, image } = props

    const port = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port })
    const startup = Probe.fromHttpGet('/ready', { port, failureThreshold: 120 })
    const readiness = Probe.fromHttpGet('/ready', { port })

    const repository = image?.repository ?? 'wandb/local'
    const tag = image?.tag ?? 'latest'
    this.deployment = new Deployment(this, `local`, {
      replicas: 1,
      metadata: {
        ...common.metadata,
      },
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
      ],
      containers: [
        {
          image: `${repository}:${tag}`,
          liveness,
          readiness,
          startup,
          envVariables: {
            ...mysqlConfigToEnv(this, 'deployment', mysql),
            ...bucketConfigToEnv(bucket),
            ...(sso != null ? ssoConfigToEnv(sso) : {}),
          },
        },
      ],
    })

    this.service = new Service(this, `service`, {
      type: ServiceType.NODE_PORT,
      metadata: common.metadata,
      selector: this.deployment,
      ports: [{ name: 'https', port, nodePort: 32543 }],
    })

    this.prometheus = new Service(this, `prometheus`, {
      type: ServiceType.NODE_PORT,
      metadata: common.metadata,
      selector: this.deployment,
      ports: [{ name: 'prometheus', port: 8181 }],
    })
  }
}
