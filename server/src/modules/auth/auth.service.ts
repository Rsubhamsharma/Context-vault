import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { registerSchema, loginSchema } from './auth.schema';
import { z } from 'zod';

export class AuthService {
  async register(data: z.infer<typeof registerSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: '24h',
    });

    return {
      user: { id: user.id, email: user.email },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async updateOnboardingStatus(userId: string, completed: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: completed,
        onboardingCompletedAt: completed ? new Date() : null,
      },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
      },
    });
  }
}

export const authService = new AuthService();
