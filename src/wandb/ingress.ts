import { ApiObjectMetadata, Chart } from 'cdk8s'
import {
  HttpIngressPathType,
  Ingress,
  IngressBackend,
  Protocol,
  Service,
  ServiceType,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'

type IngressChartProps = {
  defaultBackend?: 'app' | 'console'
  metadata: ApiObjectMetadata
  console: {
    name: string
    namespace: string
  }
  app: Service
}

export class IngressChart extends Chart {
  constructor(scope: Construct, id: string, props: IngressChartProps) {
    super(scope, id, { disableResourceNameHashes: true })

    const { app, console: consoleService, metadata, defaultBackend } = props
    const console = new Service(this, 'console', {
      type: ServiceType.EXTERNAL_NAME,
      externalName: `${consoleService.name}.${consoleService.namespace}.svc.cluster.local`,
      ports: [{ port: 9090, protocol: Protocol.TCP }],
    })

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
        {
          path: '/__weave',
          pathType: HttpIngressPathType.PREFIX,
          backend: appBackend,
        },
      ],
    })
  }
}
