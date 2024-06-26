import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CollectionActive, CollectionMode, CollectionStatus } from '../../types';
import { CollectionWithInfoV2Dto } from '@unique-nft/sdk/full';

@Entity('collections', { schema: 'public' })
@Index(['collectionId'])
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int', { name: 'collection_id' })
  collectionId: number;

  @Column('int', { name: 'tokens_total' })
  tokensTotal: number;

  @Column('int', { name: 'tokens_count' })
  tokensCount: number;

  @Column('int', { name: 'tokens_on_market' })
  tokensOnMarket: number;

  @Column({ name: 'min_price', type: 'numeric', precision: 38, scale: 18 })
  minPrice: number;

  @Column({ name: 'max_price', type: 'numeric', precision: 38, scale: 18 })
  maxPrice: number;

  @Column({ name: 'total_price', type: 'numeric', precision: 38, scale: 18 })
  totalPrice: number;

  @Column('int', { name: 'holders' })
  holders: number;

  @Column({ name: 'unique_holders', type: 'numeric', precision: 38, scale: 18 })
  uniqueHolders: number;

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

  @Column('varchar', { name: 'cover_url', length: 255, nullable: true })
  coverUrl: string;

  @Column('varchar', { name: 'token_prefix', length: 16, nullable: true })
  tokenPrefix: string;

  @Column('boolean', { name: 'mint_mode', default: false })
  mintMode: boolean;

  @Column('varchar', {
    name: 'network',
    length: 64,
    nullable: true,
    default: null,
  })
  network: string;

  @Column('jsonb', { name: 'metadata', default: {} })
  metadata: string;

  @Column('varchar', { name: 'allowed_tokens', default: '' })
  allowedTokens: string;

  @Column('enum', {
    name: 'status',
    enum: CollectionStatus,
    default: CollectionStatus.Enabled,
  })
  status: CollectionStatus;

  @Column('enum', {
    name: 'active',
    enum: CollectionActive,
    default: CollectionActive.false,
  })
  active: CollectionActive;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('jsonb', { name: 'data', default: {} })
  data: CollectionWithInfoV2Dto;
}
