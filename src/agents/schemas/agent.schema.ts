// schemas/agent.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  // Ajoutez ces propriétés pour le géocodage
  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  lastGeocoded: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type AgentDocument = Agent & Document & {
  _id: Types.ObjectId;
};

export const AgentSchema = SchemaFactory.createForClass(Agent);