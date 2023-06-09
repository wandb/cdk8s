import { Chart, ChartProps } from 'cdk8s'
import {
  ContainerProps,
  Deployment,
  Probe,
  Service,
  ServiceType,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { MysqlConfig, mysqlConfigToEnv } from '../../mysql/config'
import { config } from '../../config'
import { bucketConfigToEnv, ssoConfigToEnv } from './config'

const canConnectToDatabase = (
  scope: Construct,
  image: string,
  config: MysqlConfig,
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

export class WebServiceChart extends Chart {
  deployment: Deployment
  service: Service
  prometheus: Service

  constructor(scope: Construct, id: string, props?: ChartProps) {
    super(scope, id, props)
    const { mysql, webServices } = config
    const port = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port })
    const startup = Probe.fromHttpGet('/ready', { port, failureThreshold: 120 })
    const readiness = Probe.fromHttpGet('/ready', { port })

    const image = `${webServices?.image.repository ?? 'wandb/local'}:${
      webServices?.image.tag ?? 'latest'
    }`
    this.deployment = new Deployment(this, `local`, {
      replicas: 1,
      podMetadata: {
        annotations: {
          'checksum/mysql-password': mysql.password.checksum ?? '',
        },
      },
      initContainers: [canConnectToDatabase(this, image, mysql)],
      containers: [
        {
          image,
          liveness,
          readiness,
          startup,
          envVariables: {
            ...mysqlConfigToEnv(this, 'deployment', mysql),
            ...bucketConfigToEnv(config.bucket),
            ...(config.sso != null ? ssoConfigToEnv(config.sso) : {}),
          },
        },
      ],
    })

    this.service = new Service(this, `service`, {
      type: ServiceType.NODE_PORT,
      ports: [{ name: 'https', port, nodePort: 32543 }],
    })

    this.prometheus = new Service(this, `prometheus`, {
      type: ServiceType.NODE_PORT,
      ports: [{ name: 'prometheus', port: 8181 }],
    })
  }
}
