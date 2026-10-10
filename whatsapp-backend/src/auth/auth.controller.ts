import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  
  // Dummy in-memory store for OTPs
  private otps = new Map<string, string>();

  @Post('send-otp')
  sendOtp(@Body('phone') phone: string) {
    if (!phone || phone.length < 10) {
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
    }
    
    // Generate simple dummy 6-digit OTP
    const otp = '123456'; 
    this.otps.set(phone, otp);
    
    // In a real app we'd trigger SMS via Twilio etc.
    return { success: true, message: 'OTP sent successfully', otp_for_testing: otp };
  }

  @Post('verify-otp')
  verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    const storedOtp = this.otps.get(phone);
    if (!storedOtp || storedOtp !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
    }
    
    // Generate a simple token
    const token = Buffer.from(`${phone}-token-${Date.now()}`).toString('base64');
    
    return { success: true, token, user: { phone } };
  }
}
