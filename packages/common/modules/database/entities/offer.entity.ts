import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'offers' })
@Index(['collectionId', 'tokenId'])
export class OfferEntity {
  @PrimaryGeneratedColumn()
  id: number;

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
}
