import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: '10-digit mobile number to send verification OTP',
    example: '9876543210',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: '10-digit mobile number',
    example: '9876543210',
  })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP code (Demo code: 123456)',
    example: '123456',
  })
  otp: string;
}
