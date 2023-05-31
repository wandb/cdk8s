import './schema'

import { Construct } from 'constructs'
import { App, Chart, ChartProps, Size } from 'cdk8s'
import { logger } from './logger'
import {
  Deployment,
  PersistentVolumeAccessMode,
  PersistentVolumeClaim,
  Probe,
  Protocol,
  Volume,
} from 'cdk8s-plus-26'

const log = logger.child({ label: 'wandb/local' })

const WANDB_IMAGE = 'wandb/local'

export class Server extends Chart {
  deployment: Deployment

  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, { disableResourceNameHashes: true, ...props })

    log.info('Creating wandb/local deployment')

    this.deployment = new Deployment(this, 'local')

    // Add wandb image
    const port = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port })
    const startup = Probe.fromHttpGet('/ready', { port, failureThreshold: 120 })
    const readiness = Probe.fromHttpGet('/ready', { port })
    this.deployment
      .addContainer({ image: WANDB_IMAGE, liveness, readiness, startup })
      .addPort({ name: 'http', number: port, protocol: Protocol.TCP })
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

const t = new Server(app, 'wandb')
t.mountLegacyStorage()

log.info('Generating YAML')
app.synth()
