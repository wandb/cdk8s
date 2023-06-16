import { ApiObjectMetadata, ChartProps, Size } from 'cdk8s'
import {
  ConfigMap,
  PersistentVolumeAccessMode,
  PersistentVolumeClaim,
  Probe,
  Protocol,
  Service,
  ServiceType,
  StatefulSet,
  Volume,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { mysqlConfigToEnv } from './helpers'
import { MysqlConfig, MysqlCredentialsConfig } from './config'
import { WbChart } from '../common/chart'

type MysqlStatefulSetChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
} & MysqlConfig

const mysqlPingCheck = Probe.fromCommand([
  'sh',
  '-c',
  'mysqladmin ping -u root -p$MYSQL_ROOT_PASSWORD',
])

export class MysqlStatefulSetChart extends WbChart {
  service: Service

  constructor(
    scope: Construct,
    id: string,
    private props: MysqlStatefulSetChartProps,
  ) {
    super(scope, id, props)
    const { metadata } = props

    new ConfigMap(this, 'initdb', {
      metadata,
      data: {
        'my.cnf': `[mysqld]
binlog_format = 'ROW'
innodb_online_alter_log_max_size = 268435456
sync_binlog = 1
innodb_flush_log_at_trx_commit = 1
binlog_row_image = 'MINIMAL'
local-infile = 1
sort_buffer_size = 33554432`,
      },
    })

    const claim = new PersistentVolumeClaim(this, 'data', {
      metadata,
      accessModes: [PersistentVolumeAccessMode.READ_WRITE_ONCE],
      storage: Size.gibibytes(10),
    })

    const ss = new StatefulSet(this, 'mysql', {
      replicas: 1,
      service: new Service(this, 'mysql-service', {
        type: ServiceType.CLUSTER_IP,
        ports: [{ port: 3306, protocol: Protocol.TCP }],
      }),
      metadata,
      containers: [
        {
          image: 'mysql:8.0.33',
          liveness: mysqlPingCheck,
          readiness: mysqlPingCheck,
          portNumber: 3306,
          securityContext: {
            ensureNonRoot: false,
            allowPrivilegeEscalation: true,
            readOnlyRootFilesystem: false,
          },
          envVariables: {
            ...mysqlConfigToEnv(scope, id, this.getCredentials()),
          },
          volumeMounts: [
            {
              path: '/var/lib/mysql',
              volume: Volume.fromPersistentVolumeClaim(
                this,
                'data-claim',
                claim,
              ),
            },
          ],
        },
      ],
    })

    this.service = ss.service
  }

  getCredentials(): MysqlCredentialsConfig {
    return 'database' in this.props
      ? this.props
      : {
          host: this.service?.name ?? 'mysql-service',
          database: 'wandb_local',
          port: 3306,
          user: 'wandb',
          password: 'wandb',
          ...this.props,
        }
  }
}
