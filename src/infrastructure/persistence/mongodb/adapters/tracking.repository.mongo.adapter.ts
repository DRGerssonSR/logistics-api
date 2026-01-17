import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tracking } from '../../../../domain/entities/tracking.entity';
import { PackageStatus } from '../../../../domain/value-objects/package-status.vo';
import type { TrackingRepositoryPort } from '../../../../domain/ports/output/tracking.repository.port';
import {
  TrackingDocument,
  TrackingSchema,
} from '../schemas/tracking.schema';

interface TrackingDocumentData {
  _id: Types.ObjectId
  id: string;
  packageId: string;
  location: string;
  status: PackageStatus;
  timestamp: Date | string;
  notes?: string;
  createdAt: Date | string;
}
@Injectable()
export class TrackingRepositoryMongoAdapter implements TrackingRepositoryPort {
  constructor(
    @InjectModel(TrackingSchema.name)
    private readonly trackingModel: Model<TrackingDocument>,
  ) {}

  async create(tracking: Tracking): Promise<Tracking> {
    const savedDoc = await this.trackingModel.create({
      id: tracking.id,
      packageId: tracking.packageId,
      location: tracking.location,
      status: tracking.status,
      timestamp: tracking.timestamp,
      notes: tracking.notes,
    });

    return this.toDomain(savedDoc);
  }

  async findByPackageId(packageId: string): Promise<Tracking[]> {
    const trackingDocs = await this.trackingModel
      .find({ packageId })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return trackingDocs.map((doc) => this.toDomain(doc as unknown as TrackingDocumentData));
  }

  private toDomain(doc: TrackingDocument | TrackingDocumentData): Tracking {
    const normalizeDate = (date: Date | string | undefined): Date => {
      if (!date) return new Date();
      return date instanceof Date ? date : new Date(date);
    };

    return new Tracking({
      id: doc.id,
      packageId: doc.packageId,
      location: doc.location,
      status: doc.status,
      timestamp: normalizeDate(doc.timestamp),
      notes: doc.notes,
      createdAt: normalizeDate(doc.createdAt),
    });
  }
}