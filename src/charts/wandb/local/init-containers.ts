import { Container, EnvValue } from 'cdk8s-plus-26'

type Config = {
  image: string
  database: {
    password: EnvValue
    host: EnvValue
    user: EnvValue
    database: EnvValue
  }
}

/**
 * Simple docker container that checks for a valid connection string.
 */
export class WaitForDatabase extends Container {
  constructor(props: Config) {
    const {
      database: { password, user, database, host },
    } = props
    super({
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
}
