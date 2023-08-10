import {
  ApiResource,
  ClusterRole,
  ClusterRoleBinding,
  Cpu,
  Deployment,
  EnvFieldPaths,
  EnvValue,
  ImagePullPolicy,
  Probe,
  Service,
  ServiceAccount,
  ServiceType,
} from 'cdk8s-plus-26'
import { WbChart } from '../../global/chart'
import { ApiObjectMetadata, ChartProps, Size } from 'cdk8s'
import { Construct } from 'constructs'
import { envsToValue } from '../../global/extra-envs'
import { CustomResource, Operator } from '../../global/operator'

export type ConsoleChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
  image?: { repository?: string; tag?: string }
  operator?: Operator
  customResource?: CustomResource
  extraEnvs?: Record<string, string>
  app: Service
}

export class ConsoleChart extends WbChart {
  service: Service
  constructor(scope: Construct, id: string, props: ConsoleChartProps) {
    super(scope, id, props)
    const { metadata, extraEnvs, customResource, operator } = props

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
      ApiResource.EVENTS,
      ApiResource.custom({ apiGroup: '', resourceType: 'pods/log' }),
      ApiResource.custom({ apiGroup: 'metrics.k8s.io', resourceType: 'nodes' }),
      ApiResource.custom({
        apiGroup: 'apps.wandb.com',
        resourceType: 'weightsandbiases',
      }),
    )

    const sa = new ServiceAccount(this, `service-account`, {
      metadata: { ...metadata, namespace: customResource?.namespace },
    })
    const binding = new ClusterRoleBinding(this, `binding`, { metadata, role })
    binding.addSubjects(sa)

    const { image } = props
    const repository = image?.repository ?? 'wandb/console'
    const tag = image?.tag ?? 'latest'

    const port = 8082
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
          resources: {
            cpu: { request: Cpu.millis(100), limit: Cpu.millis(500) },
            memory: {
              request: Size.mebibytes(100),
              limit: Size.mebibytes(200),
            },
          },
          envVariables: {
            AUTH_SERVICE: EnvValue.fromValue(
              `${props.app.name}:${props.app.port}`,
            ),
            OPERATOR_NAMESPACE: EnvValue.fromValue(
              operator?.namespace ?? 'wandb',
            ),
            INSTANCE_NAME: EnvValue.fromValue(
              customResource?.name ?? 'default',
            ),
            INSTANCE_NAMESPACE: EnvValue.fromFieldRef(
              EnvFieldPaths.POD_NAMESPACE,
            ),
            ...envsToValue(extraEnvs),
          },
        },
      ],
    })

    this.service = new Service(this, `service`, {
      metadata,
      type: ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [{ name: 'console', port: 8082 }],
    })
  }
}
