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

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); // clientId -> userId

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
    return { event: 'joined', data: { success: true, activeUsers: Array.from(this.activeUsers.values()) } };
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() payload: { to: string; message: string; from: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Sending message: ', payload);
    
    const messageData = {
      id: Date.now().toString(),
      text: payload.message,
      sender: payload.from,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Broadcast to everyone else for this simple clone
    client.broadcast.emit('receiveMessage', messageData);
    
    return messageData;
  }
}
