import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'currencies' })
export class CurrencyEntity {
  @PrimaryColumn('integer')
  id: number;

  @Column({ name: 'decimals', type: 'integer' })
  decimals: number;

  @Column({ name: 'icon_url', type: 'varchar', length: '256', nullable: true })
  iconUrl: string | null;

  @Column({ name: 'fee', type: 'integer' })
  fee: number;

  @Column({ name: 'name', type: 'varchar', length: '64' })
  name: string;

  @Column({ name: 'coingecko_id', type: 'varchar', length: '128', nullable: true })
  coingeckoId: string | null;

  @Column({ name: 'usd_price', type: 'numeric', precision: 38, scale: 18, nullable: true })
  usdPrice: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
