import prisma from "../../config/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { hashPassword, comparePassword } from "../../utils/hash";
import { sendPasswordResetEmail } from "../../utils/email.util";
import crypto from "crypto";
import { AppError } from "../../../lib/error/error";


/**
 * LOGIN
 * Issues both tokens and stores the refresh token in DB.
 */
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      careAgent: true,
      client: true,
    },
  });

  if (!user) throw new Error("Invalid email");

  if (user.role === 'CLIENT' && user.client?.deletedAt) {
    throw new Error("This account has been deactivated. Please contact support.");
  }

  if (user.role === 'CARE_AGENT' && user.careAgent?.deletedAt) {
    throw new Error("This agent account is no longer active.");
  }

  const valid = await comparePassword(password, user.password);

  if (!valid) throw new Error("Invalid credentials");

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store Refresh Token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
  };
};

/**
 * REFRESH TOKEN (With Rotation)
 * Revokes the old refresh token and issues a brand new pair.
 */
export const refresh = async (oldToken: string) => {
  const decoded = verifyRefreshToken(oldToken) as any;

  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
  });

  if (!stored) throw new Error("Invalid refresh token");

  if (stored.userId !== decoded.id) {
    throw new Error("Token-user mismatch");
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token: oldToken } }).catch(() => { });
    throw new Error("Refresh token expired");
  }

  // --- REFRESH TOKEN ROTATION ---
  // 1. Delete the old token
  await prisma.refreshToken.delete({ where: { token: oldToken } });

  // 2. Generate new pair
  const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // 3. Store the new refresh token
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: decoded.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};


/**
 * LOGOUT
 */
export const logout = async (token: string) => {
  // Use deleteMany to avoid crashing if the token was already deleted or is missing
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
};

export const logoutAll = async (userId: string) => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

/**
 * GET ME
 * Fetches the current user's profile based on their role.
 */
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      careAgent: true, // Prisma will return null if the user isn't a CareAgent
      client: true,    // Prisma will return null if the user isn't a Client
    },
  });

  if (!user) throw new Error("User not found");

  // Remove the password before sending to frontend
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};



export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");



  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: {
        userId: user.id
      },
    });


    await tx.passwordResetToken.create({
      data: {
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        tokenHash,
        userId: user.id
      },
    });

  });
  await sendPasswordResetEmail(user.email, user.name, token)

}

const getValidResetToken = async (token: string) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!resetToken) {
    throw new AppError("Password reset link is invalid or has expired.", 400);
  }

  return resetToken;
};

export const validatePasswordResetToken = async (
  token: string
): Promise<void> => {
  await getValidResetToken(token);
};

/**
 * Change Password
 */

export const changePassword = async (userId: string, data: any) => {
  const { oldPassword, newPassword } = data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) throw new Error("Incorrect old password");

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return { message: "Password updated successfully" };
}

export const resetPassword = async (token: string, password: string) => {
  const tokenData = await getValidResetToken(token);
  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: tokenData.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await tx.passwordResetToken.delete({
      where: {
        id: tokenData.id,
      },
    });
  });

  return { message: "Password updated successfully" };
};