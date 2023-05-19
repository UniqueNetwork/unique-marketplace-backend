import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OfferStatus } from '../../types';
import { ContractEntity } from './contract.entity';

@Entity({ name: 'offers' })
@Index(['orderId'])
@Index(['collectionId'])
@Index(['collectionId', 'tokenId'])
export class OfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @Column({ name: 'collection_id', type: 'integer' })
  collectionId: number;

  @Column({ name: 'token_id', type: 'integer' })
  tokenId: number;

  @Column({ name: 'amount', type: 'integer' })
  amount: number;

  @Column({ name: 'price_parsed', type: 'numeric', precision: 8, scale: 5 })
  priceParsed: string;

  @Column({ name: 'price_raw', type: 'bigint' })
  priceRaw: string;

  @JoinColumn({
    name: 'contract_address',
  })
  @ManyToOne(() => ContractEntity, (contract) => contract.address)
  contract: ContractEntity;

  @Column({ type: 'varchar' })
  status: OfferStatus;

  @Column({ type: 'varchar' })
  seller: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
