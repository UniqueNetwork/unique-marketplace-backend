import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity('banners')
export class BannerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ name: 'minio_file', type: 'varchar' })
  minioFile: string;

  @Column({ name: 'button_title', type: 'varchar' })
  buttonTitle: string;

  @Column({ name: 'button_url', type: 'varchar' })
  buttonUrl: string;

  @Column({ name: 'button_color', type: 'varchar', default: '0xffffff' })
  buttonColor: string;

  @Column({ name: 'sort_index', default: 0 })
  sortIndex: number;

  @Column({ default: false })
  off: boolean;

  @Column({ name: 'collection_id', default: 0 })
  collectionId: number;

  @Column({ name: 'background_color', default: '0xffffff' })
  backgroundColor: string;

  @Column({ name: 'secondary_button_title', type: 'varchar' })
  secondaryButtonTitle: string;

  @Column({ name: 'secondary_button_url', type: 'varchar' })
  secondaryButtonUrl: string;

  @Column({ name: 'created_at' })
  createdAt: Date;
}
