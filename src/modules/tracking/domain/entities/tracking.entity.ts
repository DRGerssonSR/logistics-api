import { PackageStatus } from '../../../packages/domain/value-objects/package-status.vo';

export interface TrackingProps {
  id: string;
  packageId: string;
  location: string;
  status: PackageStatus;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
}

export type CreateTrackingProps = Pick<
  TrackingProps,
  'packageId' | 'location' | 'status' | 'notes'
> & {
  timestamp?: Date;
};

export class Tracking {
  public readonly id: string;
  public readonly packageId: string;
  public readonly location: string;
  public readonly status: PackageStatus;
  public readonly timestamp: Date;
  public readonly notes?: string;
  public readonly createdAt: Date;

  constructor(props: TrackingProps) {
    this.id = props.id;
    this.packageId = props.packageId;
    this.location = props.location;
    this.status = props.status;
    this.timestamp = props.timestamp;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateTrackingProps): Tracking {
    const now = new Date();
    return new Tracking({
      id: crypto.randomUUID(),
      packageId: props.packageId,
      location: props.location,
      status: props.status,
      timestamp: props.timestamp || now,
      notes: props.notes,
      createdAt: now,
    });
  }
}

