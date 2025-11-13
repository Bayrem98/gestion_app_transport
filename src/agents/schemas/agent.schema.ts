import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Agent extends Document {
  @Prop({ required: true, unique: true })
  nom: string;

  @Prop({ required: true })
  adresse: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: true })
  societe: string;

  @Prop({ default: false })
  voiturePersonnelle: boolean;

  @Prop()
  chauffeurNom: string;

  @Prop()
  vehiculeChauffeur: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);