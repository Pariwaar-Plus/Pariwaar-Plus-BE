import prisma from "../../config/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { hashPassword, comparePassword } from "../../utils/hash";

/**
 * REGISTER (CLIENT / CARE_AGENT only)
 * Uses a Transaction to ensure User and Profile are created together.
 */

export const register = async (data: any) => {

  if (data.role === "ADMIN") {
    throw new Error("Admin registration is not allowed through this endpoint");
  }
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(data.password);
  // Use $transaction to prevent "orphan" users if profile creation fails
  const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
      },
    });

    if (data.role === "CARE_AGENT") {
      await tx.careAgent.create({
        data: {
          userId: user.id,
          qualification: data.qualification,
          experience: data.experience,
          contact: data.contact,
          city: data.city,
        },
      });
    } else if (data.role === "CLIENT") {
      await tx.client.create({
        data: {
          userId: user.id,
          country: data.country,
          city: data.city,
          contact: data.contact,
        },
      });
    }

    return user;
  });
  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};


/**
 * LOGIN
 * Issues both tokens and stores the refresh token in DB.
 */
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("Invalid email");

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
    await prisma.refreshToken.delete({ where: { token: oldToken } }).catch(() => {});
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



/**
 * Change Password
 */

export const changePassword = async (userId: string, data: any) => {
  const { oldPassword, newPassword } = data;

  // 1. Fetch user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // 2. Verify old password
  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) throw new Error("Incorrect old password");

  // 3. Hash and update new password
  const hashedNewPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return { message: "Password updated successfully" };
};