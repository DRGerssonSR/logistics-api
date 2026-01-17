import { PackageStatus } from '../value-objects/package-status.vo';

export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
}

export interface PackageProps {
  id: string;
  trackingNumber: string;
  userId: string;
  origin: string;
  destination: string;
  status: PackageStatus;
  weight: number;
  dimensions: PackageDimensions;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePackageProps = Pick<
  PackageProps,
  'userId' | 'origin' | 'destination' | 'weight' | 'dimensions'
> & {
  trackingNumber?: string;
  status?: PackageStatus;
};

export class Package {
  public readonly id: string;
  public readonly trackingNumber: string;
  public readonly userId: string;
  public readonly origin: string;
  public readonly destination: string;
  public readonly status: PackageStatus;
  public readonly weight: number;
  public readonly dimensions: PackageDimensions;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: PackageProps) {
    this.id = props.id;
    this.trackingNumber = props.trackingNumber;
    this.userId = props.userId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.status = props.status;
    this.weight = props.weight;
    this.dimensions = props.dimensions;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreatePackageProps): Package {
    const now = new Date();
    const trackingNumber =
      props.trackingNumber ||
      `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return new Package({
      id: crypto.randomUUID(),
      trackingNumber,
      userId: props.userId,
      origin: props.origin,
      destination: props.destination,
      status: props.status || PackageStatus.PENDING,
      weight: props.weight,
      dimensions: props.dimensions,
      createdAt: now,
      updatedAt: now,
    });
  }
}

