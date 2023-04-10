import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
