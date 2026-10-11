import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpsertUserDto } from './dto/upsert-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register or update user profile (phone number and display name)
   */
  @Post('profile')
  @ApiOperation({
    summary: 'Register or update user profile',
    description:
      'Registers a new user or updates the display name for the given phone number.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile saved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number or data' })
  @ApiBody({ type: UpsertUserDto })
  async upsertProfile(@Body() body: UpsertUserDto) {
    const { phone, name, about } = body;
    if (!phone) {
      throw new HttpException(
        'Phone number is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const user = await this.usersService.upsertProfile(phone, name, about);
      return {
        success: true,
        message: 'Profile saved successfully',
        user,
      };
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Failed to save profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all registered users on the platform
   */
  @Get()
  @ApiOperation({
    summary: 'Get all registered users',
    description: 'Returns the list of registered users on the platform.',
  })
  @ApiResponse({ status: 200, description: 'List of registered users' })
  async getAllUsers() {
    const users = await this.usersService.getAllUsers();
    return {
      success: true,
      users,
    };
  }

  /**
   * Get user profile by phone number
   */
  @Get(':phone')
  @ApiOperation({
    summary: 'Get user profile by phone',
    description: 'Retrieves user details by normalized 10-digit phone number.',
  })
  @ApiParam({
    name: 'phone',
    description: '10-digit mobile number or formatted phone number',
    example: '9876543210',
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('phone') phone: string) {
    const user = await this.usersService.getProfile(phone);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return {
      success: true,
      user,
    };
  }
}
