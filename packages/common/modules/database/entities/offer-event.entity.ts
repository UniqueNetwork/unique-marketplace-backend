import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { OfferEventType } from '../../types';

@Entity({ name: 'offer-events' })
export class OfferEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'offer_id' })
  offerId: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: OfferEventType;

  @Column({ name: 'block_number' })
  blockNumber: number;

  @Column({ name: 'address_from', type: 'varchar' })
  addressFrom: string;
}
