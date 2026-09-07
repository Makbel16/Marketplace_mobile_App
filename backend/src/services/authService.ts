import bcrypt from 'bcryptjs';
import { UserRole, SellerStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/token';
import { AppError } from '../middleware/errorHandler';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  shopName?: string;
  description?: string;
  location?: string;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export interface UpdateSellerDTO {
  shopName?: string;
  description?: string;
  location?: string;
  phone?: string;
  profileImage?: string;
  bannerImage?: string;
}

export class AuthService {
  /**
   * Register a new user (Customer or Seller)
   */
  static async register(dto: RegisterDTO) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const role = dto.role || UserRole.CUSTOMER;

    // If registering as a seller, check if shop name is already taken
    if (role === UserRole.SELLER) {
      if (!dto.shopName) {
        throw new AppError('Shop name is required for seller registration.', 400);
      }
      const existingShop = await prisma.sellerProfile.findUnique({
        where: { shopName: dto.shopName },
      });
      if (existingShop) {
        throw new AppError('A shop with this name already exists. Please choose a unique name.', 409);
      }
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user and related entities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          phone: dto.phone,
          role,
        },
      });

      let sellerProfile = null;
      if (role === UserRole.SELLER && dto.shopName) {
        sellerProfile = await tx.sellerProfile.create({
          data: {
            userId: user.id,
            shopName: dto.shopName,
            description: dto.description,
            location: dto.location,
            phone: dto.phone,
            status: SellerStatus.APPROVED, // Auto-approve for streamlined onboarding
          },
        });
      } else {
        // Create an empty cart for customers
        await tx.cart.create({
          data: {
            userId: user.id,
          },
        });
      }

      return { user, sellerProfile };
    });

    // Generate token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      sellerId: result.sellerProfile?.id,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        profileImage: result.user.profileImage,
        createdAt: result.user.createdAt,
      },
      sellerProfile: result.sellerProfile,
      token,
    };
  }

  /**
   * Authenticate an existing user
   */
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        sellerProfile: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // If seller, verify status
    if (user.role === UserRole.SELLER && user.sellerProfile) {
      if (user.sellerProfile.status === SellerStatus.SUSPENDED) {
        throw new AppError('Your seller account has been suspended. Please contact support.', 403);
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sellerId: user.sellerProfile?.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      sellerProfile: user.sellerProfile,
      token,
    };
  }

  /**
   * Retrieve current authenticated user profile
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        sellerProfile: {
          select: {
            id: true,
            shopName: true,
            description: true,
            location: true,
            phone: true,
            profileImage: true,
            bannerImage: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }

  /**
   * Update basic profile details
   */
  static async updateProfile(userId: string, dto: UpdateProfileDTO) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Retrieve seller profile details
   */
  static async getSellerProfile(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            products: true,
            orderItems: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError('Seller profile not found.', 404);
    }

    return profile;
  }

  /**
   * Update seller profile details
   */
  static async updateSellerProfile(userId: string, dto: UpdateSellerDTO) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('Seller profile not found.', 404);
    }

    if (dto.shopName && dto.shopName !== profile.shopName) {
      const existingShop = await prisma.sellerProfile.findUnique({
        where: { shopName: dto.shopName },
      });
      if (existingShop) {
        throw new AppError('A shop with this name already exists.', 409);
      }
    }

    const updated = await prisma.sellerProfile.update({
      where: { userId },
      data: {
        ...(dto.shopName !== undefined && { shopName: dto.shopName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
        ...(dto.bannerImage !== undefined && { bannerImage: dto.bannerImage }),
      },
    });

    return updated;
  }
}
