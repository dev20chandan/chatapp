import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  // Extract last 10 digits for Indian/standard phone numbers if longer
  return digits.length > 10 ? digits.slice(-10) : digits;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Register or update user profile with phone and name
   */
  async upsertProfile(
    rawPhone: string,
    name: string,
    about?: string,
  ): Promise<UserDocument> {
    const phone = normalizePhone(rawPhone);
    if (!phone || phone.length < 10) {
      throw new Error('Invalid phone number. Must be at least 10 digits.');
    }

    const cleanName = name ? name.trim() : `User ${phone.slice(-4)}`;
    const updateData: Partial<User> = {
      phone,
      name: cleanName,
    };
    if (about !== undefined) {
      updateData.about = about.trim();
    }

    const user = await this.userModel.findOneAndUpdate(
      { phone },
      { $set: updateData },
      { new: true, upsert: true },
    );

    return user;
  }

  /**
   * Get user profile by phone number
   */
  async getProfile(rawPhone: string): Promise<UserDocument | null> {
    const phone = normalizePhone(rawPhone);
    if (!phone) return null;
    return this.userModel.findOne({ phone }).exec();
  }

  /**
   * Get all registered users on the platform
   */
  async getAllUsers(): Promise<any[]> {
    return this.userModel
      .find({}, { phone: 1, name: 1, about: 1, avatar: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}
