import { ApiObjectMetadata, ChartProps, Size } from 'cdk8s'
import {
  Deployment,
  EnvValue,
  PersistentVolumeAccessMode,
  PersistentVolumeClaim,
  Probe,
  Protocol,
  Service,
  ServiceType,
  Volume,
} from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { BucketConfig } from '../wandb/webservice/config'
import { WbChart } from '../common/chart'
import { MinioConfig } from './config'
import { RecreateJob } from '../common/job'

const MINIO_REGION_NAME = 'us-east-1'
const MINIO_BUCKET_NAME = 'wandb'
const MINIO_ROOT_USER = 'wandb'
const MINIO_ROOT_PASSWORD = 'wandbadmin'

type MinioChartProps = ChartProps & {
  metadata: ApiObjectMetadata
} & MinioConfig

export class MinioChart extends WbChart {
  private service: Service
  constructor(scope: Construct, id: string, props: MinioChartProps) {
    super(scope, id, props)
    const { image, metadata } = props

    const claim = new PersistentVolumeClaim(this, 'pvc', {
      metadata,
      accessModes: [PersistentVolumeAccessMode.READ_WRITE_ONCE],
      storage: Size.gibibytes(10),
    })
    const volume = Volume.fromPersistentVolumeClaim(this, 'pvc-claim', claim)

    const repository = image?.repository ?? 'minio/minio'
    const tag = image?.tag ?? 'latest'

    const liveness = Probe.fromHttpGet('/minio/health/live', { port: 9000 })
    const readiness = Probe.fromHttpGet('/minio/health/ready', { port: 9000 })
    const deployment = new Deployment(this, 'minio', {
      metadata,
      replicas: 1,
      containers: [
        {
          image: `${repository}:${tag}`,
          command: ['/bin/bash', '-c'],
          args: ['minio server /data --console-address :9090'],
          ports: [{ number: 9000 }, { number: 9090 }],
          volumeMounts: [{ volume, path: '/data' }],
          liveness,
          readiness,
          securityContext: {
            ensureNonRoot: false,
            allowPrivilegeEscalation: true,
            readOnlyRootFilesystem: false,
          },
          envVariables: {
            MINIO_ROOT_USER: EnvValue.fromValue(MINIO_ROOT_USER),
            MINIO_ROOT_PASSWORD: EnvValue.fromValue(MINIO_ROOT_PASSWORD),
            MINIO_REGION_NAME: EnvValue.fromValue(MINIO_REGION_NAME),
          },
        },
      ],

      volumes: [volume],
    })

    this.service = new Service(this, 'service', {
      metadata,
      type: ServiceType.CLUSTER_IP,
      ports: [
        { name: 'api', port: 9000, targetPort: 9000, protocol: Protocol.TCP },
        {
          name: 'console',
          port: 9090,
          targetPort: 9090,
          protocol: Protocol.TCP,
        },
      ],
      selector: deployment,
    })

    const { client } = props
    const clientRepository = client?.image?.repository ?? 'minio/mc'
    const clientTag = client?.image?.tag ?? 'latest'

    new RecreateJob(this, `create-bucket`, {
      metadata,
      containers: [
        {
          name: 'create-bucket',
          image: `${clientRepository}:${clientTag}`,
          securityContext: {
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },
          envVariables: {
            MINIO_ACCESS_KEY: EnvValue.fromValue(MINIO_ROOT_USER),
            MINIO_SECRET_KEY: EnvValue.fromValue(MINIO_ROOT_PASSWORD),
            MINIO_SERVER_ENDPOINT: EnvValue.fromValue(
              `${this.service.name}:9000`,
            ),
            BUCKET_NAME: EnvValue.fromValue(MINIO_BUCKET_NAME),
          },
          command: [
            '/bin/sh',
            '-c',
            `echo "Creating MinIO bucket..."
until /bin/sh -c "mc config host add local http://$MINIO_SERVER_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY"; do
  echo "Waiting for MinIO server to become available..."
  sleep 3
done
mc mb local/$BUCKET_NAME --ignore-existing
echo "Bucket created."`,
          ],
        },
      ],
    })
  }

  getBucket(): BucketConfig {
    return {
      connectionString: `s3://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@${this.service.name}:9000/${MINIO_BUCKET_NAME}`,
      region: MINIO_REGION_NAME,
    }
  }
}
