import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'contracts' })
@Index(['address', 'processedAt'])
export class ContractEntity {
  @PrimaryColumn()
  address: string;

  @Column({ unique: true })
  version: number;

  @Column()
  createdAt: number;

  @Column()
  processedAt: number;
}
