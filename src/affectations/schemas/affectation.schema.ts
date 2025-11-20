import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class AgentAffectation {
  @Prop({ required: true })
  agentNom: string;

  @Prop({ required: true })
  adresse: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: true })
  societe: string;
}

export const AgentAffectationSchema = SchemaFactory.createForClass(AgentAffectation);

@Schema({ timestamps: true })
export class Affectation extends Document {
  @Prop({ required: true })
  chauffeur: string;

  @Prop({ required: true })
  heure: string;

  @Prop({ type: [AgentAffectationSchema], default: [] })
  agents: AgentAffectation[];

  // Anciens champs pour la rétrocompatibilité (rendus optionnels)
  @Prop()
  agentNom?: string;

  @Prop()
  adresse?: string;

  @Prop()
  telephone?: string;

  @Prop()
  societe?: string;

  @Prop({ required: true, enum: ['Ramassage', 'Départ'] })
  typeTransport: string;

  @Prop({ required: true })
  jour: string;

  @Prop({ required: true })
  dateAjout: string;

  @Prop({ required: true })
  dateReelle: string;

  @Prop({ required: true })
  prixCourse: number;

  @Prop({ required: true, enum: ['Non payé', 'Payé'] })
  statutPaiement: string;

  @Prop()
  vehicule?: string;
}

export const AffectationSchema = SchemaFactory.createForClass(Affectation);