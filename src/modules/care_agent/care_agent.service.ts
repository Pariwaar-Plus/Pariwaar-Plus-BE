import { Role } from "@prisma/client";
import prisma from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import crypto from "crypto";
import { sendWelcomeEmail } from "../../utils/email.util";
import { CareAgentDTO } from "../../@types";



export const registerCareAgent = async (data: CareAgentDTO) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new Error("User already exists");

  const tempPassword = data.password || crypto.randomBytes(8).toString("hex");
  const hashed = await hashPassword(tempPassword);
  try{
    // Use $transaction to prevent "orphan" users if profile creation fails
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          role: Role.CARE_AGENT,
        },
      });

      const careAgent = await tx.careAgent.create({
        data: {
          userId: user.id,
          qualification: data.qualification,
          experience: data.experience,
          contact: data.contact,
          ward: data.ward,
          tole: data.tole,
          city: data.city
        },
      });
        

      return {
        user: {id: user.id, name: user.name, email: user.email},
        careAgent
      };
    });

    // Post-Transaction: Send Email

    try {
        await sendWelcomeEmail(result.user.email, result.user.name, tempPassword);
    } catch (error) {
        console.error("Welcome email failed to send:", error);
    }
    
    return {
      ...result,
      tempPassword
    }
  } catch (e: any){
    if (e.code === "P2002") {
      throw new Error("User with this email already exists");
    }
    throw new Error(e.message);
  }

};


// Get all care agents for Admin dashboards
export const getActiveCareAgents = async () => {
  return await prisma.careAgent.findMany({
    where: {
      deletedAt: null
    },
    include: { user: true }
  });
};


/**
 * Get single care agent profile
 * Excludes sensitive user data like password
 */
export const getCareAgentByUserId = async (userId: string) => {
  return prisma.careAgent.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });
};

/**
 * Update care agent profile (self-update)
 * Only allows specific fields to be updated
 */
export const updateCareAgent = async (userId: string, data: any) => {
  // Destructure to ensure we only update allowed professional fields
  const { qualification, experience, contact, city } = data;

  return prisma.careAgent.update({
    where: { userId },
    data: {
      qualification,
      experience,
      contact,
      city,
    },
  });
};

/**
 * For the Admin: Find by CareAgent Profile ID (from the URL param)
 */
export const getCareAgentByProfileId = async (profileId: string) => {
    const careAgent = await prisma.careAgent.findUnique({
    where: { id: profileId },
    include: { 
        user: { select: { name: true, email: true } } 
    }
    });
    if (!careAgent) throw new Error("Care Agent profile not found");
    return careAgent;
};

/**
 * CARE AGENT: View my assigned Care Receivers for today's visits
 */
export const getMyAssignedCareReceivers = async (userId: string) => {
  // 1. Find the agent's profile ID using their logged-in User ID
  const agent = await prisma.careAgent.findUnique({
    where: { userId }
  });

  if (!agent) throw new Error("Care Agent profile not found");

  // 2. Get all active assignments
  const assignments = await prisma.careAssignment.findMany({
    where: { 
      careAgentId: agent.id,
      status: 'ACTIVE'
    },
    include: {
      careReceiver: {
        select: {
          id: true,
          name: true,
          age: true,
          gender: true,
          city: true,
          ward: true,
          tole: true,
          contactNumber: true,
          existingConditions: true
        }
      }
    } 
  });

  return assignments
};

// Soft Delete care agent profile
export const deleteCareAgent = async (careAgentId: string) => {
  // First, find the agent to get the linked userId
  const agent = await prisma.careAgent.findUnique({
    where: { id: careAgentId },
    select: { userId: true }
  });

  if (!agent) throw new Error("Care Agent not found");

  // Use a transaction to soft-delete both records
  return await prisma.$transaction(async (tx) => {
    // 1. Soft delete the CareAgent profile
    const updatedAgent = await tx.careAgent.update({
      where: { id: careAgentId },
      data: { deletedAt: new Date() },
    });

    // 2. Soft delete the User
    await tx.user.update({
      where: { id: agent.userId },
      data: { deletedAt: new Date() },
    });

    return updatedAgent;
  });
};
