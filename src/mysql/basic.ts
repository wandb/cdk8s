import { ApiObjectMetadata, Chart, ChartProps } from 'cdk8s'
import { ConfigMap, Probe, Service, StatefulSet } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { config } from '../config'
import { mysqlConfigToEnv } from './helpers'
import { MysqlConfig, MysqlCredentialsConfig } from './config'

type MysqlStatefulSetChartProps = ChartProps & {
  metadata: ApiObjectMetadata
} & MysqlConfig

export class MysqlStatefulSetChart extends Chart {
  service: Service

  constructor(
    scope: Construct,
    id: string,
    private props: MysqlStatefulSetChartProps,
  ) {
    super(scope, id, props)
    const { metadata } = props
    const liveness = Probe.fromCommand(['sh', '-c', 'mysqladmin ping -h'])

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

    const ss = new StatefulSet(this, 'mysql', {
      replicas: 1,
      metadata: config.common.metadata,
      containers: [
        {
          image: 'mysql:5.7',
          liveness,
          portNumber: 3306,
          envVariables: {
            ...mysqlConfigToEnv(scope, id, this.getCredentials()),
          },
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
