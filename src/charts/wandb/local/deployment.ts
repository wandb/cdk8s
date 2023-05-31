import { Container, Deployment, EnvValue } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { WaitForDatabase } from './init-containers'

type CheckDatabaseProps = {
  image: string
  database: {
    user: EnvValue
    database: EnvValue
    host: EnvValue
    password: EnvValue
  }
}

export const waitForDatabase = (props: CheckDatabaseProps) => {
  const { image, database: db } = props
  const { host, password, user, database } = db
  return new Container({
    ...props,
    envVariables: {
      DB_HOST: host,
      DB_PASSWORD: password,
      DB_USER: user,
      DB: database,
    },
    command: [
      'bash',
      '-c',
      'until mysql -h$DB_HOST -u$DB_USER -p$DB_PASSWORD -D$DB ' +
        '--execute="SELECT 1"; do echo waiting for mysql database; sleep 2; done',
    ],
  })
}

export class WeightsAndBiasesLocalDeployment extends Deployment {
  constructor(scope: Construct, config: DeploymentConfig) {
    const id = 'local'
    super(scope, id, {
      initContainers: [new WaitForDatabase(config)],
      containers: [],
    })
  }
}
