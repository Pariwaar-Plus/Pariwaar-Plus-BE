import prisma from "../../config/prisma";
import { CreateVisitLogDTO } from "../../@types";

export const createVisitLog = async (userId: string, data: CreateVisitLogDTO) => {
  // 1. Get the Care Agent's profile ID from their User ID
  const agent = await prisma.careAgent.findUnique({
    where: { userId }
  });

  if (!agent) throw new Error("Care Agent profile not found");

  // 2. Validate that the agent is actually assigned to this parent
  const assignment = await prisma.careAssignment.findUnique({
    where: {
      careReceiverId_careAgentId: {
        careReceiverId: data.careReceiverId,
        careAgentId: agent.id
      }
    }
  });

  if (!assignment || assignment.status !== 'ACTIVE') {
    throw new Error("You are not authorized to log visits for this parent.");
  }

  // 3. Create the Visit Log
  return await prisma.visitLog.create({
    data: {
      careReceiverId: data.careReceiverId,
      careAgentId: agent.id,

      // Vital Signs
      systolicBP: data.systolicBP,
      diastolicBP: data.diastolicBP,
      bloodSugar: data.bloodSugar ?? null,
      oxygenLevel: data.oxygenLevel ?? null,
      weight: data.weight ?? null,

      // Qualitative Data
      medicationAdherence: data.medicationAdherence,
      medicationNotes: data.medicationNotes ?? null,
      generalNotes: data.generalNotes ?? null,
    }
  });
};

/**
 * GET Visit History
 * Fetches all logs for a specific parent.
 */
export const getVisitHistory = async (viewerId: string, role: string, careReceiverId: string) => {

  // 1. Authorization Logic
  if (role === 'CLIENT') {
    // Verify this parent belongs to this client
    const ownership = await prisma.careReceiver.findFirst({
      where: { id: careReceiverId, clientId: viewerId }
    });
    if (!ownership) throw new Error("Unauthorized: This is not your family record.");
  }

  else if (role === 'CARE_AGENT') {
    // Step 1: Find CareAgent profile using User.id
    const agent = await prisma.careAgent.findUnique({
      where: {
        userId: viewerId
      }
    });

    if (!agent) {
      throw new Error("Care Agent profile not found");
    }

    // Step 2: Verify assignment exists
    const assignment = await prisma.careAssignment.findUnique({
      where: {
        careReceiverId_careAgentId: {
          careReceiverId,
          careAgentId: agent.id
        }
      }
    });

    if (!assignment || assignment.status !== "ACTIVE") {
      throw new Error(
        "Unauthorized: You are not assigned to this patient."
      );
    }
  }

  // 3. If Admin or authorized, return the logs
  return await prisma.visitLog.findMany({
    where: { careReceiverId },
    orderBy: { createdAt: 'desc' },
    include: {
      careAgent: {
        include: { user: { select: { name: true } } }
      }
    }
  });
};


export const getVisitByAssignmentAndSchedule = async (assignmentIds: string[], fromDate: Date) => {
  const visits = await prisma.visitLog.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      scheduledAt: { gte: fromDate },
      status: { not: "CANCELLED" },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return visits

}