import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PackageStatus } from '../../domain/value-objects/package-status.vo';

@Entity('packages')
@Index(['userId'])
@Index(['trackingNumber'], { unique: true })
export class PackageEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column('uuid')
  userId: string;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column({
    type: 'enum',
    enum: PackageStatus,
    default: PackageStatus.PENDING,
  })
  status: PackageStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  weight: number;

  @Column('jsonb')
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

