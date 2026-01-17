import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PackageStatus } from '../../../../domain/value-objects/package-status.vo';

export type TrackingDocument = HydratedDocument<TrackingSchema>;

@Schema({ 
  collection: 'trackings', 
  timestamps: true, 
  versionKey: false,
})
export class TrackingSchema {
  @Prop({ required: true, type: String, unique: true, index: true })
  id: string;

  @Prop({ required: true, type: String, index: true })
  packageId: string;

  @Prop({ required: true, type: String })
  location: string;

  @Prop({ 
    required: true, 
    enum: Object.values(PackageStatus),
    type: String 
  })
  status: PackageStatus;

  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({ type: String, required: false })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TrackingMongoSchema = SchemaFactory.createForClass(TrackingSchema);

TrackingMongoSchema.index({ packageId: 1, timestamp: -1 });