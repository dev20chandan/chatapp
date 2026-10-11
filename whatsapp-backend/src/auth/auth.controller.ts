import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // Dummy in-memory store for OTPs
  private otps = new Map<string, string>();

  @Post('send-otp')
  @ApiOperation({
    summary: 'Request OTP verification code',
    description: 'Generates and sends a 6-digit OTP code to the given phone number.',
  })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  sendOtp(@Body() body: SendOtpDto) {
    const phone = body.phone;
    if (!phone || phone.length < 10) {
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
    }

    // Generate simple dummy 6-digit OTP (123456 for testing)
    const otp = '123456';
    this.otps.set(phone, otp);

    return {
      success: true,
      message: 'OTP sent successfully',
      otp_for_testing: otp,
    };
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP code',
    description: 'Validates the submitted OTP and generates an authentication token.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    const { phone, otp } = body;
    const storedOtp = this.otps.get(phone);
    if (!storedOtp || storedOtp !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
    }

    // Generate token
    const token = Buffer.from(`${phone}-token-${Date.now()}`).toString('base64');

    return { success: true, token, user: { phone } };
  }
}
