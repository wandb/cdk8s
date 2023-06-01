import { Construct } from 'constructs'
import { MysqlAuthConfig, configToEnv } from './config'
import { Container } from 'cdk8s-plus-26'

type CheckDatabaseConfig = {
  image: string
  database: MysqlAuthConfig
}

export const canConnectToDatabase = (
  scope: Construct,
  config: CheckDatabaseConfig,
) => {
  const { image, database } = config
  return new Container({
    image,
    envVariables: {
      ...configToEnv(scope, database),
    },
    command: [
      'bash',
      '-c',
      'until mysql -h$DATABASE_HOST -P$DATABASE_PORT -u$DATABASE_USER -p$DATABASE_PASSWORD -D$DATABASE ' +
        '--execute="SELECT 1"; do echo waiting for mysql database; sleep 2; done',
    ],
  })
}
