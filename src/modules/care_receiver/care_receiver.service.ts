import prisma from "../../config/prisma";
import { CreateCareReceiverDTO, UpdateCareReceiverDTO } from "./types/care_receiver.dto";
import { AppError } from "../../../lib/error/error";
import { AssignmentStatus } from "@prisma/client";

/**
 * Create a new Care Receiver under an existing Client
 */
export const createCareReceiver = async (data: CreateCareReceiverDTO) => {
  // Validate DOB
  const dob = new Date(data.dateOfBirth);

  if (isNaN(dob.getTime())) {
    throw new Error("Invalid date of birth");
  }

  // Ensure the parent client exists and is active
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
  });

  if (!client || client.deletedAt) {
    throw new Error("Client not found");
  }

  const careReceiver = await prisma.careReceiver.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      dateOfBirth: dob,
      gender: data.gender,
      phone: data.phone || null,
      city: data.city,
      district: data.district || null,
      ward: data.ward,
      tole: data.tole,
      bloodGroup: data.bloodGroup || null,
      medicalCondition: data.medicalCondition || null,
      allergies: data.allergies || null,
      mobilityStatus: data.mobilityStatus,
      notes: data.notes || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
    },
  });

  return careReceiver;
};

/**
 * Get all care receivers for Admin dashboards
 */
export const getActiveCareReceivers = async (filter: any) => {
  return await prisma.careReceiver.findMany({
    where: {
      ...filter,
      deletedAt: null,
    },
    include: {
      client: {
        select: {
          id: true,
          phone: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get a single care receiver by its profile ID.
 * Includes the currently assigned care agent's info.
 */
export const getCareReceiverById = async (careReceiverId: string) => {
  const careReceiver = await prisma.careReceiver.findUnique({
    where: {
      id: careReceiverId,
      deletedAt: null,
    },
    include: {
      client: {
        select: {
          id: true,
          phone: true,
          countryCode: true,
          country: true,
        },
      },
      assignments: {
        where: { deletedAt: null, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          careAgent: {
            select: {
              id: true,
              employeeId: true,
              phone: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!careReceiver) {
    throw new AppError("Care receiver not found", 404);
  }

  // A care receiver has at most one active care agent
  const activeAssignment = careReceiver.assignments[0] ?? null;

  const age = Math.floor(
    (Date.now() - new Date(careReceiver.dateOfBirth).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  );

  return {
    ...careReceiver,
    careAgent: activeAssignment?.careAgent ?? null,
    stats: {
      age,
    },
  };
};

/**
 * Update care receiver details (Admin)
 */
export const updateCareReceiver = async (
  careReceiverId: string,
  data: UpdateCareReceiverDTO
) => {
  const existing = await prisma.careReceiver.findUnique({
    where: { id: careReceiverId },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Care receiver not found");
  }

  const updated = await prisma.careReceiver.update({
    where: { id: careReceiverId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: new Date(data.dateOfBirth),
      }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.district !== undefined && { district: data.district || null }),
      ...(data.ward !== undefined && { ward: data.ward }),
      ...(data.tole !== undefined && { tole: data.tole }),
      ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup || null }),
      ...(data.medicalCondition !== undefined && {
        medicalCondition: data.medicalCondition || null,
      }),
      ...(data.allergies !== undefined && { allergies: data.allergies || null }),
      ...(data.mobilityStatus !== undefined && {
        mobilityStatus: data.mobilityStatus,
      }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.emergencyContactName !== undefined && {
        emergencyContactName: data.emergencyContactName || null,
      }),
      ...(data.emergencyContactPhone !== undefined && {
        emergencyContactPhone: data.emergencyContactPhone || null,
      }),
    },
  });

  return updated;
};

/**
 * Soft delete a care receiver profile.
 * Also deactivates any active assignments to avoid orphaned active links.
 */
export const deleteCareReceiver = async (careReceiverId: string) => {
  const existing = await prisma.careReceiver.findUnique({
    where: { id: careReceiverId },
    select: { id: true },
  });

  if (!existing) throw new Error("Care receiver not found");

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    // 1. Deactivate any active assignments
    await tx.careAssignment.updateMany({
      where: {
        careReceiverId: careReceiverId,
        status: "ACTIVE",
      },
      data: {
        status: AssignmentStatus.INACTIVE,
        endDate: now,
      },
    });

    // 2. Soft delete the care receiver profile
    const updated = await tx.careReceiver.update({
      where: { id: careReceiverId },
      data: { deletedAt: now },
    });

    return updated;
  });
};
