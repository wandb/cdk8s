import './schema'

import { Construct } from 'constructs'
import { App, Chart, ChartProps, Helm, Size } from 'cdk8s'
import {
  Deployment,
  PersistentVolumeAccessMode,
  PersistentVolumeClaim,
  Probe,
  Volume,
} from 'cdk8s-plus-26'
import { createLocalContainer } from './wandb/local/container'

const WANDB_IMAGE = 'wandb/local'

export class Server extends Chart {
  deployment: Deployment

  constructor(scope: Construct, id: string, props: ChartProps) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    log.info('Creating wandb/local deployment')

    this.deployment = new Deployment(this, 'local')
    this.deployment.addContainer(createLocalContainer(scope, props))
  }

  /**
   * Provision and map persistent volume for internal MySQL and Minio
   *
   * @deprecated
   */
  mountLegacyStorage(storage = Size.gibibytes(50)) {
    log.warn(
      'Creating storage volume mount is depericated. ' +
        'Please provide an external MySQL and objecstore.',
    )
    const container = this.deployment.containers.find(
      (d) => d.image === WANDB_IMAGE,
    )
    const pvc = new PersistentVolumeClaim(this, 'legacy', {
      accessModes: [PersistentVolumeAccessMode.READ_WRITE_ONCE],
      storage,
    })
    const volume = Volume.fromPersistentVolumeClaim(this, 'legacy-data2', pvc)
    container?.mount('/vol', volume)
    return this
  }
}

log.info('Initalizing app')
const app = new App({ recordConstructMetadata: true })

const t = new Server(app, 'wandb', {
  user: 'wandb',
  host: 'localhost',
  password: { key: 'testing', secret: 'mysql-secrets' },
  database: 'wandb_local',
})
t.mountLegacyStorage()

log.info('Generating YAML')
app.synth()

new Deployment(null, 'my-deployment', {
  containers: [{ image: 'wandb/local', liveness: Probe.fromHttpGet('/ready') }],
  
})

new Helm(null, 'my-heal', {
  chart: 'bitami/redis'
  values: {
    
  }
})