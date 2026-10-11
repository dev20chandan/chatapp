import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertUserDto {
  @ApiProperty({
    description: 'User mobile number (10 digits or with country code)',
    example: '9876543210',
  })
  phone: string;

  @ApiProperty({
    description: 'Display name chosen by the user',
    example: 'Chandan Dev',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Status or about message',
    example: 'Hey there! I am using Chat',
    default: 'Hey there! I am using Chat',
  })
  about?: string;
}
