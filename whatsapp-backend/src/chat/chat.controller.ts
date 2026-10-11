import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  @ApiOperation({
    summary: 'Get chat history between two users',
    description:
      'Fetches past message history between user1 and user2 sorted chronologically.',
  })
  @ApiQuery({
    name: 'user1',
    description: 'Current user phone number',
    example: '9876543210',
  })
  @ApiQuery({
    name: 'user2',
    description: 'Contact user phone number',
    example: '9123456789',
  })
  @ApiResponse({ status: 200, description: 'List of past messages' })
  async getHistory(
    @Query('user1') user1: string,
    @Query('user2') user2: string,
  ) {
    if (!user1 || !user2) {
      return [];
    }
    return this.chatService.getMessagesBetweenUsers(user1, user2);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get recent conversations for a user',
    description:
      'Fetches the list of active conversations with last message preview for the given phone number.',
  })
  @ApiQuery({
    name: 'phone',
    description: 'Current user phone number',
    example: '9876543210',
  })
  @ApiResponse({ status: 200, description: 'Recent conversations' })
  async getConversations(@Query('phone') phone: string) {
    if (!phone) {
      return [];
    }
    return this.chatService.getRecentConversations(phone);
  }
}
