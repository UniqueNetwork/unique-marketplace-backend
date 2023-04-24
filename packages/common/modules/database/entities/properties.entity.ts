import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TypeAttributToken } from '../../types';

@Index('Search_index_locale', ['collection_id', 'token_id', 'locale'])
@Index('List_items_inx', ['list_items'])
@Index('Total_items_inx', ['total_items'])
@Index('Keys_inx', ['key'])
@Entity('properties', { schema: 'public' })
export class PropertiesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int', { name: 'collection_id' })
  collection_id: number;

  @Column('int', { name: 'token_id' })
  token_id: number;

  @Column('varchar', { name: 'network', length: 16 })
  network: string;

  @Column('text', { name: 'items', array: true, default: [] })
  items: string[];

  @Column('boolean', { name: 'is_trait', default: "'f'" })
  is_trait: boolean;

  @Column('text', { name: 'locale', nullable: true })
  locale: string | null;

  @Column('varchar', { name: 'key', nullable: true, length: 200 })
  key: string | null;

  @Column('smallint', { name: 'count_item', nullable: true })
  count_item: number | null;

  @Column('smallint', { name: 'total_items', nullable: true })
  total_items: number | null;

  @Column('text', { name: 'list_items', array: true, default: [] })
  list_items: string[];

  @Column({
    type: 'enum',
    enum: TypeAttributToken,
    nullable: false,
    default: TypeAttributToken.String,
  })
  type: TypeAttributToken;

  @Column('jsonb', { name: 'attributes', default: {} })
  attributes: string;

  @Column('jsonb', { name: 'nested', default: {} })
  nested: string;
}
