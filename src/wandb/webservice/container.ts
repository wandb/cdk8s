import { Container, Probe, Protocol } from 'cdk8s-plus-26'
import {} from '../../schema'
import { Construct } from 'constructs'
import { MysqlAuthConfig } from '../../mysql/config'

type WeightsAndBiasesLocalProps = {
  image: string
}

type OidcConfig = {
  issuer: string
  clientId: string
  authMethod: string
}

type LocalConfig = {
  image?: {
    repository: string
    tag?: string
  }
  database: MysqlAuthConfig
}

const LOCAL_WEB_PORT = 8080

export const createLocalContainer = (scope: Construct, config: LocalConfig) => {
  const port = LOCAL_WEB_PORT
  const liveness = Probe.fromHttpGet('/healthz', { port })
  const startup = Probe.fromHttpGet('/ready', {
    port,
    failureThreshold: 120,
  })
  const readiness = Probe.fromHttpGet('/ready', { port })
  const { image } = config
  return new Container({
    image: `${image?.repository ?? 'wandb/local'}:${image?.tag ?? 'latest'}`,
    liveness,
    readiness,
    startup,
    ports: [{ name: 'http', number: port, protocol: Protocol.TCP }],
    envVariables: {
      ...databaseAuthToEnv(scope, config.database),
    },
  })
}

export class WeightsAndBiasesLocal extends Container {
  constructor({ image }: WeightsAndBiasesLocalProps) {
    // Probes
    const port = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port })
    const startup = Probe.fromHttpGet('/ready', { port, failureThreshold: 120 })
    const readiness = Probe.fromHttpGet('/ready', { port })

    super({ image, liveness, readiness, startup })
  }

  oidc({ issuer, clientId, authMethod }: OidcConfig) {
    this.env.addVariable('OIDC_ISSUER', { value: issuer })
    this.env.addVariable('OIDC_CLIENT_ID', { value: clientId })
    this.env.addVariable('OIDC_AUTH_METHOD', { value: authMethod })
  }

  license(license: string) {}
}
