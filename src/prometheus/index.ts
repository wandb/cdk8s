import { Construct } from 'constructs'
import { WbChart } from '../global/chart'
import { ApiObjectMetadata, ChartProps } from 'cdk8s'
import {
  ConfigMap,
  Deployment,
  EnvValue,
  Protocol,
  Service,
  Volume,
} from 'cdk8s-plus-26'
import { envsToValue } from '../global/extra-envs'
import { MysqlCredentialsConfig } from '../mysql'
import { mysqlConfigToEnv } from '../mysql/helpers'

export type PrometheusChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
  image?: { repository?: string; tag?: string }
  extraEnvs?: Record<string, string>
  mysql: MysqlCredentialsConfig
}

const prometheusConfig = ({
  mysqlExportorLabel,
}: {
  mysqlExportorLabel: string
}) => `
global:
  scrape_interval: 15s
  evaluation_interval: 15s
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets:
          - 'localhost:9090'
  - job_name: mysql_exporter
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels:
          - __meta_kubernetes_pod_label_app
        action: keep
        regex: ${mysqlExportorLabel}
`

export class PrometheusChart extends WbChart {
  deployment: Deployment
  service: Service

  constructor(scope: Construct, id: string, props: PrometheusChartProps) {
    super(scope, id, props)

    const { metadata, image, extraEnvs } = props
    const repository = image?.repository ?? 'prom/prometheus'
    const tag = image?.tag ?? 'latest'

    const mysqlExporter = new Deployment(this, `exporter-mysql`, {
      replicas: 1,
      metadata,
      podMetadata: {
        labels: { app: 'wandb-prometheus-exporter-mysql' },
      },
      containers: [
        {
          image: 'prom/mysqld-exporter:latest',
          envVariables: {
            ...mysqlConfigToEnv(this, 'mysql', props.mysql),
            DATA_SOURCE: EnvValue.fromValue(
              '$(MYSQL_USER):$(MYSQL_PASSWORD)@$(MYSQL_HOST):$(MYSQL_PORT)/$(MYSQL_DATABASE))',
            ),
            ...envsToValue(extraEnvs),
          },
          ports: [{ name: 'mysql-metrics', number: 9104 }],
        },
      ],
    })

    const configMap = new ConfigMap(this, 'config', {
      data: {
        'prometheus.yml': prometheusConfig({
          mysqlExportorLabel: mysqlExporter.podMetadata.getLabel('app') ?? '',
        }),
      },
    })

    this.deployment = new Deployment(this, `prometheus`, {
      replicas: 1,
      metadata,
      containers: [
        {
          image: `${repository}:${tag}`,
          securityContext: {
            ensureNonRoot: false,
            allowPrivilegeEscalation: true,
            readOnlyRootFilesystem: false,
          },
          ports: [{ number: 9090 }],
          args: [
            '--config.file=/etc/prometheus/prometheus.yml',
            '--storage.tsdb.path=/prometheus/',
          ],
          envVariables: {
            ...envsToValue(extraEnvs),
          },
          volumeMounts: [
            {
              path: '/etc/prometheus/',
              volume: Volume.fromConfigMap(
                this,
                'prometheus-config',
                configMap,
              ),
            },
            {
              path: '/prometheus/',
              volume: Volume.fromEmptyDir(
                this,
                'prometheus-storage-volume',
                'prometheus-storage-volume',
              ),
            },
          ],
        },
      ],
    })

    this.service = new Service(this, 'service', {
      metadata,
      selector: this.deployment,
      ports: [{ targetPort: 9090, port: 80, protocol: Protocol.TCP }],
    })
  }
}
