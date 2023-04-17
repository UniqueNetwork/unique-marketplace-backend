import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphileWorkerModule } from 'nestjs-graphile-worker';

type ConnectionLink = {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

/**
 * Tasks Worker Module
 * @constructor
 *
 */
export const TasksWorkerModule = GraphileWorkerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const db: ConnectionLink = config.get('database');
    return {
      connectionString: `${db.type}://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`,
    };
  },
});
