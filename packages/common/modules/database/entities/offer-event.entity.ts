import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { OfferEventType } from '../../types';
import { OfferEntity } from './offer.entity';
import { PropertiesEntity } from './properties.entity';

@Entity({ name: 'offer_events' })
export class OfferEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn({
    name: 'offer_id',
  })
  @ManyToOne(() => OfferEntity, (offer) => offer.id)
  offer: OfferEntity;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: OfferEventType;

  @Column({ name: 'meta', type: 'jsonb' })
  meta: string;

  @Column({ name: 'block_number', type: 'integer' })
  blockNumber: number;

  @Column({ name: 'address', type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer' })
  commission: number;

  @Column({ name: 'collection_mode', type: 'varchar' })
  collectionMode: string;

  @Column({ type: 'varchar' })
  network: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => PropertiesEntity)
  token_properties: PropertiesEntity;
}
