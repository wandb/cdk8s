import { ChartProps, ApiObjectMetadata } from 'cdk8s'
import { ConfigMap } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { WbChart } from '../global/chart'
import { RedisCredentialsConfig } from './config'
import { REDIS_CERTIFICATE_FILE_NAME } from './helpers'

type RedisExternalChartProps = ChartProps & {
  metadata?: ApiObjectMetadata
} & RedisCredentialsConfig

export let redisCaCertConfigMap: string | null = null

export class RedisExternalChart extends WbChart {
  constructor(scope: Construct, id: string, props: RedisExternalChartProps) {
    super(scope, id, props)

    const { metadata } = props

    if (props.caCert != null) {
      const cfg = new ConfigMap(this, 'cert', {
        metadata,
        data: {
          [REDIS_CERTIFICATE_FILE_NAME]: props.caCert,
        },
      })

      redisCaCertConfigMap = cfg.name
    }
  }
}
