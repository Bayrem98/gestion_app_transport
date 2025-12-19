import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document  } from "mongoose";

export type SocieteDocument = Societe & Document;

@Schema({ timestamps: true })
export class Societe {
  @Prop({ required: true })
  nom: string;

  @Prop()
  adresse?: string;

  @Prop()
  telephone?: string;

  @Prop()
  matriculef?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SocieteSchema = SchemaFactory.createForClass(Societe);