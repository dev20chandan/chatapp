import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); // clientId -> userId

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.activeUsers.delete(client.id);
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    this.activeUsers.set(client.id, userId);
    client.broadcast.emit('userJoined', { userId });
    return {
      event: 'joined',
      data: { success: true, activeUsers: Array.from(this.activeUsers.values()) },
    };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    payload: {
      to: string;
      message: string;
      from: string;
      imageUri?: string;
      audioUri?: string;
      audioDuration?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received message to store and send: ', payload);

    let savedDoc: any = null;
    try {
      savedDoc = await this.chatService.saveMessage({
        sender: payload.from,
        receiver: payload.to,
        text: payload.message,
        imageUri: payload.imageUri,
        audioUri: payload.audioUri,
        audioDuration: payload.audioDuration,
      });
    } catch (err) {
      console.warn('Could not save message to MongoDB (check connection):', err);
    }

    const messageData = {
      id: savedDoc ? savedDoc._id.toString() : Date.now().toString(),
      text: payload.message,
      sender: payload.from,
      receiver: payload.to,
      imageUri: payload.imageUri,
      audioUri: payload.audioUri,
      audioDuration: payload.audioDuration,
      time:
        savedDoc?.time ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Broadcast to recipient / other clients
    client.broadcast.emit('receiveMessage', messageData);

    return messageData;
  }
}
