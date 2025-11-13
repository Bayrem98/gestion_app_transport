import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Affectation extends Document {
  @Prop({ required: true })
  chauffeur: string;

  @Prop({ required: true })
  heure: number;

  @Prop({ required: true })
  agentNom: string;

  @Prop({ required: true })
  adresse: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: true })
  societe: string;

  @Prop({ default: 'Non renseigné' })
  vehicule: string;

  @Prop({ required: true, enum: ['Ramassage', 'Départ'] })
  typeTransport: string;

  @Prop({ required: true })
  jour: string;

  @Prop({ required: true })
  dateAjout: string;

  @Prop({ required: true })
  dateReelle: string;

  @Prop({ required: true, default: 0 })
  prixCourse: number;

  @Prop({ default: 'Non payé', enum: ['Non payé', 'Payé'] })
  statutPaiement: string;
}

export const AffectationSchema = SchemaFactory.createForClass(Affectation);