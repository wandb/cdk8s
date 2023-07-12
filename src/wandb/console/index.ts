import {
  ApiResource,
  ClusterRole,
  ClusterRoleBinding,
  Deployment,
  EnvValue,
  ImagePullPolicy,
  Probe,
  Service,
  ServiceAccount,
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
    const { metadata } = props

    // TODO: Reduce scope
    const role = new ClusterRole(this, `role`, { metadata })
    role.allow(
      ['get', 'list', 'watch', 'delete', 'update', 'patch', 'create'],
      ApiResource.PODS,
      ApiResource.DEPLOYMENTS,
      ApiResource.STATEFUL_SETS,
      ApiResource.POD_DISRUPTION_BUDGETS,
      ApiResource.NODES,
      ApiResource.SECRETS,
      ApiResource.SERVICE_ACCOUNTS,
      ApiResource.ROLES,
      ApiResource.ROLE_BINDINGS,
      ApiResource.BINDINGS,
      ApiResource.NODES,
      ApiResource.HORIZONTAL_POD_AUTOSCALERS,
      ApiResource.REPLICA_SETS,
      ApiResource.CONTROLLER_REVISIONS,
      ApiResource.REPLICATION_CONTROLLERS,
      ApiResource.ENDPOINTS,
      ApiResource.CONFIG_MAPS,
      ApiResource.INGRESSES,
      ApiResource.INGRESS_CLASSES,
      ApiResource.PRIORITY_LEVEL_CONFIGURATIONS,
      ApiResource.NAMESPACES,
      ApiResource.custom({ apiGroup: '', resourceType: 'pods/log' }),
      ApiResource.custom({ apiGroup: 'metrics.k8s.io', resourceType: 'nodes' }),
    )

    const sa = new ServiceAccount(this, `service-account`, { metadata })
    const binding = new ClusterRoleBinding(this, `binding`, { metadata, role })
    binding.addSubjects(sa)

    const { image } = props
    const repository = image?.repository ?? 'wandb/console'
    const tag = image?.tag ?? 'latest'

    const port = 8081
    const liveness = Probe.fromHttpGet('/healthy', { port })
    const readiness = Probe.fromHttpGet('/ready', { port })

    const deployment = new Deployment(this, `console`, {
      metadata,
      replicas: 1,
      serviceAccount: sa,
      automountServiceAccountToken: true,
      containers: [
        {
          image: `${repository}:${tag}`,
          imagePullPolicy: ImagePullPolicy.ALWAYS,
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
