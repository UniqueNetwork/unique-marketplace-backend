import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Client } from 'pg';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Logger } from '@nestjs/common';
export class PgTransportClient extends ClientProxy {
  private logger = new Logger('PgNotifyClient');
  private client: Client;

  private connected = false;

  protected serializer = {
    serialize: (input, options) => {
      return input;
    },
  };

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

  async connect(): Promise<any> {
    if (this.connected) {
      return;
    }
    await this.client.connect();
    this.connected = true;
    this.logger.log('Connected');
  }

  async close() {
    this.client.end();
    this.logger.log('Disconnected');
  }

  async dispatchEvent(packet: ReadPacket<Record<string, any>>): Promise<any> {
    // todo serializer?
    this.client.query(
      `notify "${packet.pattern}", '${JSON.stringify(packet.data)}'`
    );
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  ): () => void {
    this.dispatchEvent(packet).then(() => callback({}));
  }
}
