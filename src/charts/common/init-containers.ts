import { Container, EnvValue } from 'cdk8s-plus-26'

type CheckDatabaseConfig = {
  image: string
  database: {
    password: EnvValue
    host: EnvValue
    user: EnvValue
    database: EnvValue
  }
}

export const canConnectToDatabase = (
  config: CheckDatabaseConfig,
): Container => {
  const {
    image,
    database: { password, user, database, host },
  } = config
  return new Container({
    image,
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
