import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
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
  //@Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'collection_id' })
  collectionId: number;

  @Column({ name: 'token_id' })
  tokenId: number;

  @Column({ name: 'amount' })
  amount: number;

  @Column({ name: 'price', type: 'bigint' })
  price: bigint;

  @JoinColumn({
    name: 'contract_address',
  })
  @ManyToOne(() => ContractEntity)
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
