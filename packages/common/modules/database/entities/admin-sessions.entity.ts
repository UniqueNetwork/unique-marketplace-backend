import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sessions', { schema: 'public' })
export class AdminSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { name: 'address', length: 128 })
  address: string;

  @Column('varchar', { name: 'substrate_address', length: 128 })
  substrate_address: string;

  @Column('int', { name: 'collection_id' })
  collection_id: number;

  @Column('jsonb', { name: 'metadata', default: {} })
  metadata: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;
}
