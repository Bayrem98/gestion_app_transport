import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupadminDocument = Supadmin & Document;

@Schema()
export class Supadmin {
  @Prop({ required: true, type: String })
  username: string;

  @Prop({ required: true, type: String })
  password: string;
}

export const SupadminSchema = SchemaFactory.createForClass(Supadmin);
