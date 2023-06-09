import { Chart } from 'cdk8s'
import { Deployment, Probe, Service, ServiceType } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { mysqlConfigToEnv } from '../../mysql/config'
import { config } from '../../config'

export class WebServiceChart extends Chart {
  deployment: Deployment
  service: Service
  prometheus: Service

  constructor(scope: Construct, id: string) {
    super(scope, id)
    const { mysql } = config
    const port = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port })
    const startup = Probe.fromHttpGet('/ready', { port, failureThreshold: 120 })
    const readiness = Probe.fromHttpGet('/ready', { port })
    this.deployment = new Deployment(this, `local`, {
      replicas: 1,
      containers: [
        {
          image: 'wandb/local:latest',
          liveness,
          readiness,
          startup,
          envVariables: {
            ...mysqlConfigToEnv(scope, mysql),
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
