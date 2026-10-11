import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, index: true })
  sender: string;

  @Prop({ required: true, index: true })
  receiver: string;

  @Prop({ default: '' })
  text: string;

  @Prop()
  imageUri?: string;

  @Prop()
  audioUri?: string;

  @Prop()
  audioDuration?: string;

  @Prop({ default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
  time: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for fast conversation lookups
MessageSchema.index({ sender: 1, receiver: 1 });
