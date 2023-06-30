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
  metadata: ApiObjectMetadata
  consoleService: {
    name: string
    namespace: string
  }
  app: Service
}

export class IngressChart extends Chart {
  constructor(scope: Construct, id: string, props: IngressChartProps) {
    super(scope, id, { disableResourceNameHashes: true })

    const { app, consoleService, metadata } = props
    const console = new Service(this, 'console', {
      type: ServiceType.EXTERNAL_NAME,
      externalName: `${consoleService.name}.${consoleService.namespace}.svc.cluster.local`,
      ports: [{ port: 9090, protocol: Protocol.TCP }],
    })

    new Ingress(this, `ingress`, {
      metadata,
      defaultBackend: IngressBackend.fromService(app),
      rules: [
        {
          path: '/console',
          backend: IngressBackend.fromService(console),
          pathType: HttpIngressPathType.PREFIX,
        },
        {
          path: '/__weave',
          pathType: HttpIngressPathType.PREFIX,
          backend: IngressBackend.fromService(app),
        },
      ],
    })
  }
}
