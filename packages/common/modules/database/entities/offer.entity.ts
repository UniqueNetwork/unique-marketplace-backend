import { Entity, Column, Index } from 'typeorm';
import { OfferStatus } from '../../types';

@Entity({ name: 'offers' })
@Index(['collectionId', 'tokenId'])
export class OfferEntity {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column({ name: 'offer_id' })
  offerId: number;

  @Column({ name: 'collection_id' })
  collectionId: number;

  @Column({ name: 'token_id' })
  tokenId: number;

  @Column({ name: 'amount' })
  amount: number;

  @Column({ name: 'price', type: 'bigint' })
  price: bigint;

  @Column({ name: 'contract_address', type: 'varchar' })
  contractAddress: string;

  @Column({ type: 'enum', enum: OfferStatus })
  status: OfferStatus;
}
