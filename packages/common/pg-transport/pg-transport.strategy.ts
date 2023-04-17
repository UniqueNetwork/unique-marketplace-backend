import {
  BaseRpcContext,
  CustomTransportStrategy,
  Server,
} from '@nestjs/microservices';
import { Client } from 'pg';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export class PgTransportStrategy
  extends Server
  implements CustomTransportStrategy
{
  private client: Client;
  private connected = false;

  constructor(private options: PostgresConnectionOptions) {
    super();
    this.client = new Client({
      // todo use current connection: const client: PgClient = (dataSource.driver as PostgresDriver).master._clients[0];
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      database: options.database,
    });
  }

  async listen(callback: () => void) {
    await this.connect();
    await Promise.all(
      Array.from(this.messageHandlers.keys()).map((channel) => {
        return this.listenTo(channel);
      })
    );
    this.client.on('notification', (message: any) => {
      this.handleEvent(
        message.channel,
        {
          pattern: message.channel,
          data: JSON.parse(message.payload),
        },
        new BaseRpcContext(message)
      );
    });
    callback();
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    await this.client.connect();
    this.connected = true;
    this.logger.log('Connected');
  }

  async listenTo(channel: string): Promise<void> {
    await this.client.query(`LISTEN "${channel}"`);
    this.logger.log(`Subscribed to "${channel}" channel`);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async close() {
    this.client.end();
    this.logger.log('Disconnected');
  }
}
