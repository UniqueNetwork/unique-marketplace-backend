import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CollectionMode, CollectionStatus } from '../../types';

@Entity('collections', { schema: 'public' })
@Index(['collectionId'])
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int', { name: 'collection_id' })
  collectionId: number;

  @Column('varchar', { name: 'owner', length: 128, nullable: true })
  owner: string;

  @Column('enum', { name: 'mode', enum: CollectionMode, nullable: true })
  mode: CollectionMode;

  @Column('int', { name: 'decimal_points', default: 0 })
  decimalPoints: number;

  @Column('varchar', { name: 'name', length: 64, nullable: true })
  name: string;

  @Column('varchar', { name: 'description', length: 256, nullable: true })
  description: string;

  @Column('varchar', { name: 'token_prefix', length: 16, nullable: true })
  tokenPrefix: string;

  @Column('boolean', { name: 'mint_mode', default: false })
  mintMode: boolean;

  @Column('int', { name: 'total_tokens', default: 0 })
  totalTokens: number;

  @Column('varchar', { name: 'allowed_tokens', default: '' })
  allowedTokens: string;

  @Column('enum', {
    name: 'status',
    enum: CollectionStatus,
    default: CollectionStatus.Enabled,
  })
  status: CollectionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('varchar', { name: 'network', length: 64, nullable: true })
  network: string;

  @Column('jsonb', { name: 'data', default: {} })
  data: string;
}
