import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'contracts' })
@Index(['address', 'processedAt'])
export class ContractEntity {
  @PrimaryColumn()
  address: string;

  @Column({ unique: true })
  version: number;

  @Column()
  commission: number;

  @Column({ name: 'created_at' })
  createdAt: number;

  @Column({ name: 'processed_at' })
  processedAt: number;
}
