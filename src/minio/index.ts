import { ApiObjectMetadata, Chart, ChartProps } from 'cdk8s'
import {
  Deployment,
  EnvValue,
  PersistentVolumeClaim,
  Pod,
  Service,
  ServiceType,
  Volume,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { BucketConfig } from '../wandb/webservice/config'

type MinioChartProps = ChartProps & {
  metadata: ApiObjectMetadata
  image?: { repository?: string; tag?: string }
}

export class MinioChart extends Chart {
  private service: Service
  constructor(scope: Construct, id: string, props: MinioChartProps) {
    super(scope, id, props)
    const { image, metadata } = props

    const claim = new PersistentVolumeClaim(scope, 'minio-pvc', {})
    const volume = Volume.fromPersistentVolumeClaim(this, 'minio-pvc', claim)

    const repository = image?.repository ?? 'minio/minio'
    const tag = image?.tag ?? 'latest'

    const pod = new Pod(scope, 'minio', {
      metadata,
      containers: [
        {
          image: `${repository}:${tag}`,
          command: ['/bin/bash', '-c'],
          args: ['minio server /data --console-address :9090'],
          ports: [{ number: 9000 }, { number: 9090 }],
          volumeMounts: [{ volume, path: '/data' }],
          envVariables: {
            MINIO_ROOT_USER: EnvValue.fromValue('wandb'),
            MINIO_ROOT_PASSWORD: EnvValue.fromValue('wandbadmin'),
            MINIO_REGION_NAME: EnvValue.fromValue('us-east-1'),
          },
        },
      ],

      volumes: [volume],
    })

    this.service = new Service(this, 'minio', {
      metadata,
      type: ServiceType.NODE_PORT,
      ports: [{ port: 9000, nodePort: 32530 }],
      selector: pod,
    })
  }

  getBucket(): BucketConfig {
    return {
      connectionString: `s3://${this.service.name}:9000`,
      region: 'us-east-1',
    }
  }
}
