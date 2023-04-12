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

  @Column('int', { name: 'collection_id' })
  collectionId: number;

  @Column('int', { name: 'token_id' })
  tokenId: number;

  @Column('varchar', { name: 'owner_token', length: 128, nullable: true })
  owner_token: string;

  @Column('jsonb', { name: 'data', default: {} })
  data: string;

  @Column('jsonb', { name: 'nested', default: [] })
  nested: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
