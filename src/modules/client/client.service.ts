import crypto from "crypto";
import prisma from "../../config/prisma";
import { AppError } from "../../../lib/error/error";
import { hashPassword } from "../../utils/hash";
import { sendClientWelcomeEmail  } from "../../utils/email.util";

import { CreateClientDTO, UpdateClientDTO } from "./schemas/client.schema";
import { Role } from "@prisma/client";

/* ─────────────────────────────────────────────
CREATE
───────────────────────────────────────────── */

export const registerClient = async (
    adminId: string,
    data: CreateClientDTO
) => {
  // 1. Verify admin
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.ADMIN) {
        throw new AppError("Unauthorized: Only admins can register clients", 403);
    }

    // 2. Check email uniqueness
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new AppError("A user with this email already exists", 409);
    }

  // 3. Hash password
  const tempPassword = data.password || crypto.randomBytes(8).toString("hex");
  const hashedPassword = await hashPassword(tempPassword);

  // 4. Transaction: create User + Client profile
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name:     data.name,
          email:    data.email,
          password: hashedPassword,
          role:     Role.CLIENT,
        },
      });

      const client = await tx.client.create({
        data: {
          userId:        user.id,
          phone:         data.phone,
          countryCode:   data.countryCode,
          secondaryPhone: data.secondaryPhone || null,
          country:       data.country,
          timezone:      data.timezone,
          address:       data.address || null,
          city:          data.city || null,
          billingType:   data.billingType   ?? "MONTHLY",
          paymentStatus: data.paymentStatus ?? "PENDING",
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      return { user, client };
    });

    // 5. Send welcome email (non-blocking)
    try {
      await sendClientWelcomeEmail (
        result.user.email,
        result.user.name,
        tempPassword
      );
    } catch (emailError) {
      console.error("[registerClient] Welcome email failed:", emailError);
    }

    return {
      client:       result.client,
      tempPassword, // return to admin as backup
    };
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new AppError("A user with this email or phone already exists", 409);
    }
    throw err;
  }
};

/* ─────────────────────────────────────────────
  READ — all clients (admin)
───────────────────────────────────────────── */

export const getAllClients = async () => {
  return await prisma.client.findMany({
    where:   { deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      careReceivers: {
        where:   { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id:     true,
          name:   true,
          gender: true,
          city:   true,
          mobilityStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/* ─────────────────────────────────────────────
  READ — single client by profile ID (admin)
───────────────────────────────────────────── */

export const getClientById = async (clientId: string) => {
  const client = await prisma.client.findUnique({
    where: { id: clientId, deletedAt: null },
    include: {
      user: {
        select: {
          id:        true,
          name:      true,
          email:     true,
          role:      true,
          createdAt: true,
          updatedAt: true,
        },
      },
      careReceivers: {
        where:   { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) throw new AppError("Client not found", 404);

  // Flatten user fields for convenience
  return {
    id:            client.id,
    userId:        client.userId,

    // User (flattened)
    name:             client.user.name,
    email:            client.user.email,
    role:             client.user.role,
    accountCreatedAt: client.user.createdAt,
    accountUpdatedAt: client.user.updatedAt,

    // Contact
    phone:          client.phone,
    countryCode:    client.countryCode,
    secondaryPhone: client.secondaryPhone,

    // Location
    country:  client.country,
    timezone: client.timezone,
    address:  client.address,
    city:     client.city,

    // Billing
    billingType:   client.billingType,
    paymentStatus: client.paymentStatus,

    // Relations
    careReceivers: client.careReceivers,

    // Computed
    stats: {
      totalCareReceivers:  client.careReceivers.length,
      createdAt:           client.createdAt,
      updatedAt:           client.updatedAt,
    },
  };
};

/* ─────────────────────────────────────────────
  READ — client by userId (for client's own view)
───────────────────────────────────────────── */

export const getClientByUserId = async (userId: string) => {
  const client = await prisma.client.findUnique({
    where: { userId, deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      careReceivers: {
        where:   { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) throw new AppError("Client account not found", 404);
  return client;
};

/* ─────────────────────────────────────────────
  UPDATE
───────────────────────────────────────────── */

export const updateClient = async (
  clientId: string,
  data: UpdateClientDTO
) => {
  const existing = await prisma.client.findUnique({
    where: { id: clientId, deletedAt: null },
    select: { userId: true },
  });

  if (!existing) throw new AppError("Client not found", 404);

  // If name is being updated, update the User record too
  if (data.name) {
    await prisma.user.update({
      where: { id: existing.userId },
      data:  { name: data.name },
    });
  }

  const { name, ...clientData } = data; // name lives on User, not Client

  return await prisma.client.update({
    where: { id: clientId },
    data:  clientData,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

/* ─────────────────────────────────────────────
  DELETE (soft)
───────────────────────────────────────────── */

export const deleteClient = async (clientId: string) => {
  const client = await prisma.client.findUnique({
    where: { id: clientId, deletedAt: null },
    select: { userId: true },
  });

  if (!client) throw new AppError("Client not found", 404);

  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Soft delete Client profile
    const deleted = await tx.client.update({
      where: { id: clientId },
      data:  { deletedAt: now },
    });

    // 2. Soft delete User account (prevents login)
    await tx.user.update({
      where: { id: client.userId },
      data:  { deletedAt: now },
    });

    // 3. Soft delete all CareReceivers
    await tx.careReceiver.updateMany({
      where: { clientId, deletedAt: null },
      data:  { deletedAt: now },
    });

    return deleted;
  });
};