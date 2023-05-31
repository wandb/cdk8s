import { Container, Probe } from 'cdk8s-plus-26'

type WeightsAndBiasesLocalProps = {
  image: string
}

type OidcConfig = {
  issuer: string
  clientId: string
  authMethod: string
}

export class WeightsAndBiasesLocal extends Container {
  constructor({ image }: WeightsAndBiasesLocalProps) {
    const httpEndpointPort = 8080
    const liveness = Probe.fromHttpGet('/healthz', { port: httpEndpointPort })
    const startup = Probe.fromHttpGet('/ready', {
      port: httpEndpointPort,
      failureThreshold: 120,
    })
    const readiness = Probe.fromHttpGet('/ready', { port: httpEndpointPort })
    super({ image, liveness, readiness, startup })
  }

  oidc({ issuer, clientId, authMethod }: OidcConfig) {
    this.env.addVariable('OIDC_ISSUER', { value: issuer })
    this.env.addVariable('OIDC_CLIENT_ID', { value: clientId })
    this.env.addVariable('OIDC_AUTH_METHOD', { value: authMethod })
  }

  license(license: string) {}
}
