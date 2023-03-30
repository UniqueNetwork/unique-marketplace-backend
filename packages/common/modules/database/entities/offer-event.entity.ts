import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { OfferEventType } from '../../types';
import { OfferEntity } from './offer.entity';

@Entity({ name: 'offer-events' })
export class OfferEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({
    name: 'offer_id',
  })
  @ManyToOne(() => OfferEntity)
  offer: OfferEntity;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: OfferEventType;

  @Column({ name: 'block_number' })
  blockNumber: number;

  @Column({ name: 'address', type: 'varchar' })
  address: string;
}
