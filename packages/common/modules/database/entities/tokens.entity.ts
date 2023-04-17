import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index('Collection_and_token_idx', ['collectionId', 'tokenId'])
@Entity('tokens', { schema: 'public' })
export class TokensEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', {
    name: 'network',
    length: 64,
    nullable: true,
    default: null,
  })
  network: string;

  @Column('int', { name: 'collection_id' })
  collectionId: number;

  @Column('int', { name: 'token_id' })
  tokenId: number;

  @Column('varchar', { name: 'owner_token', length: 128, nullable: true })
  owner_token: string;

  @Column('jsonb', { name: 'nested', default: {} })
  nested: string;

  @Column('jsonb', { name: 'other_owners', default: {} })
  otherOwners: string;

  @Column('int', { name: 'amount' })
  amount: number;

  @Column('jsonb', { name: 'data', default: {} })
  data: string;

  @Column('boolean', { name: 'burned', default: false })
  burned: boolean;

  @Column('boolean', { name: 'parse_data', default: false })
  parseData: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
