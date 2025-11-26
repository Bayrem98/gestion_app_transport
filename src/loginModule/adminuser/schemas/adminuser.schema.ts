import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminuserDocument = Adminuser & Document;

@Schema()
export class Adminuser {
  @Prop({ required: true, type: String })
  username: string;

  @Prop({ required: true, type: String })
  password: string;
}

export const AdminuserSchema = SchemaFactory.createForClass(Adminuser);
