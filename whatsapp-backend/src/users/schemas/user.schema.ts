import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true, trim: true })
  phone: string; // 10-digit normalized phone number (e.g. "9876543210")

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: 'Hey there! I am using Chat', trim: true })
  about: string;

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
