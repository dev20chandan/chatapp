import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async saveMessage(data: {
    sender: string;
    receiver: string;
    text?: string;
    imageUri?: string;
    audioUri?: string;
    audioDuration?: string;
    time?: string;
  }): Promise<MessageDocument> {
    return this.messageModel.create({
      sender: data.sender,
      receiver: data.receiver,
      text: data.text || '',
      imageUri: data.imageUri,
      audioUri: data.audioUri,
      audioDuration: data.audioDuration,
      time:
        data.time ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  async getMessagesBetweenUsers(user1: string, user2: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(100)
      .exec();
  }

  async getRecentConversations(userPhone: string) {
    return this.messageModel
      .find({
        $or: [{ sender: userPhone }, { receiver: userPhone }],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
