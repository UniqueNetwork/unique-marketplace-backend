import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class PropertiesTable1681310408929 implements MigrationInterface {
  name: 'PropertiesTable1681310408929';
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'properties',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'collection_id',
            type: 'int',
          },
          {
            name: 'token_id',
            type: 'int',
          },
          {
            name: 'network',
            type: 'varchar',
            length: '16',
          },
          {
            name: 'items',
            type: 'text',
            isArray: true,
          },
          {
            name: 'is_trait',
            type: 'boolean',
            default: false,
          },
          {
            name: 'locale',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'key',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'count_item',
            type: 'smallint',
            isNullable: true,
          },
          {
            name: 'total_items',
            type: 'smallint',
            isNullable: true,
          },
          {
            name: 'list_items',
            type: 'text',
            isArray: true,
          },

          {
            name: 'type',
            type: 'enum',
            enum: [
              'ImageURL',
              'Enum',
              'String',
              'Prefix',
              'VideoURL',
              'Number',
            ],
            default: "'String'",
          },
          {
            name: 'nested',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'attributes',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'Search_index_locale',
            columnNames: ['collection_id', 'token_id', 'locale'],
          },
          {
            name: 'List_items_inx',
            columnNames: ['list_items'],
          },
          {
            name: 'Total_items_inx',
            columnNames: ['collection_id'],
          },
          {
            name: 'Keys_inx',
            columnNames: ['key'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('properties');
  }
}
