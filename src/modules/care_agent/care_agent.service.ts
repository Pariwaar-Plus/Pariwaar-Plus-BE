import { Prisma, Role, CareAgentStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import crypto from "crypto";
import { sendCareAgentWelcomeEmail } from "../../utils/email.util";
import { CreateCareAgentDTO, RegisterCareAgentResult } from "./types/care_agent.dto";
import { generateEmployeeId } from "../../utils/employee_id";
import { AppError } from "../../../lib/error/error";




export const registerCareAgent = async (data: CreateCareAgentDTO): Promise<RegisterCareAgentResult> => {
  
  // Validate DOB
  const dob = new Date(data.dateOfBirth);

  if (isNaN(dob.getTime())) {
    throw new Error("Invalid date of birth");
  }

  // Check if user exists (including soft-deleted)
  const existingUser  = await prisma.user.findUnique({
    where: { email: data.email },
    include: { careAgent: true },
  });

  if (existingUser && !existingUser.deletedAt) {
    if (existingUser.role === Role.CARE_AGENT) {
      throw new Error(
        "This email is already registered to an active Care Agent."
      );
    }

    throw new Error(
      `This email is already in use by a ${existingUser.role}.`
    );
  }

  // Set up credentials
  const tempPassword = data.password || crypto.randomBytes(8).toString("hex");
  const hashed = await hashPassword(tempPassword);

  /**
   * Retry logic for employeeId collision
   */
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try{
      // Use $transaction to prevent "orphan" users if profile creation fails
      const result = await prisma.$transaction(async (tx) => {
        const employeeId = await generateEmployeeId(tx);
        /**
         * Create or Restore User
         */
        const user = await tx.user.upsert({
          where: {
            email: data.email
          },
          update: {
            name: data.name,
            password: hashed,
            role: Role.CARE_AGENT,
            deletedAt: null,
          },
          create: {
            name: data.name,
            email: data.email,
            password: hashed,
            role: Role.CARE_AGENT,
          },
        });
        /**
        * Create or Restore CareAgent
        */
        const careAgent = await tx.careAgent.upsert({
          where: {
            userId: user.id
          },
          update: {
            employeeId,
            status: CareAgentStatus.AVAILABLE,
            qualification: data.qualification,
            experience: data.experience,
            phone: data.phone,
            secondaryPhone: data.secondaryPhone,
            gender: data.gender,
            dateOfBirth: dob,
            city: data.city,
            ward: data.ward,
            tole: data.tole,
            district: data.district,
            specialization: data.specialization,
            longitude: data.longitude,
            latitude: data.latitude,
            citizenshipNo: data.citizenshipNo,
            licenseNo: data.licenseNo,
            deletedAt: null,
          },
          create: {
            userId: user.id,
            employeeId, 
            qualification: data.qualification,
            experience: data.experience,
            phone: data.phone,
            secondaryPhone: data.secondaryPhone,
            gender: data.gender,
            dateOfBirth: dob,
            city: data.city,
            ward: data.ward,
            tole: data.tole,
            district: data.district,
            specialization: data.specialization,
            longitude: data.longitude,
            latitude: data.latitude,
            citizenshipNo: data.citizenshipNo,
            licenseNo: data.licenseNo,
          },
        });
          

        return {
          user,
          careAgent
        };
      });

      // Post-Transaction: Send Email

      try {
          await sendCareAgentWelcomeEmail(result.user.email, result.user.name, result.careAgent.employeeId, tempPassword);
      } catch (emailError) {
          console.error("Welcome email failed to send:", emailError);
      }
      return {
        ...result,
        tempPassword
      }
    }catch (e: any){
      /**
       * Retry on unique constraint collision
       */
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        // Retry employeeId generation
        if (attempt < MAX_RETRIES) {
          continue;
        }

        throw new Error(
          "Failed to generate unique employee ID. Please retry."
        );
      }

      console.error("Register Care Agent Error:", e);

      throw new Error(
        e.message || "Failed to register care agent"
      );
    }
  }

  // If we somehow exit the retry loop without returning, throw an error
  throw new Error("Failed to register care agent after multiple attempts");
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
  const {contact, city } = data;

  return prisma.careAgent.update({
    where: { userId },
    data: {
      contact,
      city,
    },
  });
};

// Update Care Agent Details By admin
export const updateCareAgentByAdmin = async (careAgentId: string, data: any) => {
  const {
    name,
    email,
    ...careAgentData
  } = data;
  const result = await prisma.$transaction(async (tx) => {

    // 1. Get relation
  const agent = await tx.careAgent.findUnique({
    where: { id: careAgentId },
    select: { userId: true }
  });

  if (!agent) throw new Error("CareAgent not found");

  // 2. Update USER table (ONLY user fields)
  if (name || email) {
    await tx.user.update({
      where: { id: agent.userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      }
    });
    }

    // 3. Update CARE AGENT table (ONLY agent fields)
    const updatedAgent = await tx.careAgent.update({
      where: { id: careAgentId },
      data: {
        phone: careAgentData.phone,
        secondaryPhone: careAgentData.secondaryPhone || null,
        gender: careAgentData.gender,
        dateOfBirth: new Date(careAgentData.dateOfBirth),

        qualification: careAgentData.qualification,
        specialization: careAgentData.specialization || null,
        experience: careAgentData.experience,

        city: careAgentData.city,
        district: careAgentData.district || null,
        ward: careAgentData.ward,
        tole: careAgentData.tole,

        latitude: careAgentData.latitude ?? null,
        longitude: careAgentData.longitude ?? null,

        citizenshipNo: careAgentData.citizenshipNo || null,
        licenseNo: careAgentData.licenseNo || null,
      }
    });

    return updatedAgent;
  });

  return result;
};

/**
 * For the Admin: Find by CareAgent Profile ID (from the URL param)
 */
export const getCareAgentByProfileId = async (profileId: string) => {
  const careAgent = await prisma.careAgent.findUnique({
    where: {
      id: profileId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      assignments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          careReceiver: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
      visitLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          // add your actual VisitLog fields here
        },
      },
    },
  });

  if (!careAgent) {
    throw new AppError("Care agent not found", 404);
  }

  // ── Computed stats ──
  const totalAssignments = await prisma.careAssignment.count({
    where: { careAgentId: profileId },
  });

  const activeAssignments = await prisma.careAssignment.count({
    where: {
      careAgentId: profileId,
      status: "ACTIVE", // adjust to your CareAssignment status enum
    },
  });

  const joinedDaysAgo = Math.floor(
    (Date.now() - new Date(careAgent.joinedDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const age = Math.floor(
    (Date.now() - new Date(careAgent.dateOfBirth).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  );

  return {
    // ── Account ──
    id:          careAgent.id,
    userId:      careAgent.userId,
    employeeId:  careAgent.employeeId,
    status:      careAgent.status,
    joinedDate:  careAgent.joinedDate,

    // ── User info (flattened) ──
    name:             careAgent.user.name,
    email:            careAgent.user.email,
    role:             careAgent.user.role,
    accountCreatedAt: careAgent.user.createdAt,
    accountUpdatedAt: careAgent.user.updatedAt,

    // ── Personal ──
    gender:         careAgent.gender,
    dateOfBirth:    careAgent.dateOfBirth,
    phone:          careAgent.phone,
    secondaryPhone: careAgent.secondaryPhone,

    // ── Professional ──
    qualification:  careAgent.qualification,
    specialization: careAgent.specialization,
    experience:     careAgent.experience,

    // ── Documents ──
    citizenshipNo: careAgent.citizenshipNo,
    licenseNo:     careAgent.licenseNo,

    // ── Location ──
    city:      careAgent.city,
    district:  careAgent.district,
    ward:      careAgent.ward,
    tole:      careAgent.tole,
    latitude:  careAgent.latitude,
    longitude: careAgent.longitude,

    // ── Relations ──
    assignments: careAgent.assignments,
    recentVisitLogs: careAgent.visitLogs,

    // ── Computed ──
    stats: {
      age,
      joinedDaysAgo,
      totalAssignments,
      activeAssignments,
      hasCoordinates: careAgent.latitude !== null && careAgent.longitude !== null,
      hasDocuments:   Boolean(careAgent.citizenshipNo) || Boolean(careAgent.licenseNo),
    },
  };
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
  // 1. Verify agent existence and get userId
  const agent = await prisma.careAgent.findUnique({
    where: { id: careAgentId },
    select: { userId: true }
  });

  if (!agent) throw new Error("Care Agent not found");

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    // 2. Set all active assignments for this agent to INACTIVE
    // This prevents "orphaned" active assignments in your dashboard
    await tx.careAssignment.updateMany({
      where: {
        careAgentId: careAgentId,
        status: "ACTIVE",
      },
      data: {
        status: "INACTIVE",
        endDate: now,
      },
    });

    // 3. Soft delete the CareAgent profile
    const updatedAgent = await tx.careAgent.update({
      where: { id: careAgentId },
      data: { deletedAt: now },
    });

    // 4. Soft delete the User (prevents future logins)
    await tx.user.update({
      where: { id: agent.userId },
      data: { deletedAt: now },
    });

    return updatedAgent;
  });
};