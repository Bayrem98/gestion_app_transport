import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Chauffeur extends Document {
  @Prop({ required: true, unique: true })
  nom: string;

  @Prop({ required: true })
  cin: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: true })
  societe: string;

  @Prop({ required: true })
  voiture: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ChauffeurSchema = SchemaFactory.createForClass(Chauffeur);