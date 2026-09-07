import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config/environment';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sellerId?: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};
