import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import { CreateVisitLogDTO } from "./types/visit_log.dto";
import { NotFoundError } from "../../../lib/error/NotfoundError";
import { ForbiddenError } from "../../../lib/error/ForbiddenError";

export const createVisitLog = async (userId: string, data: CreateVisitLogDTO) => {
  // 1. Get the Care Agent's profile ID from their User ID
  const agent = await prisma.careAgent.findUnique({
    where: { userId }
  });

  if (!agent) throw new Error("Care Agent profile not found");

  // 2. Validate that the agent is actually assigned to this parent
  const assignment = await prisma.careAssignment.findUnique({
    where: {
      id: data.assignmentId
    }
  });

  if (!assignment || assignment.status !== 'ACTIVE') {
    throw new Error("You are not authorized to log visits for this parent.");
  }

  // 3. Create the Visit Log
  return await prisma.visitLog.create({
    data: { createdBy: userId, careAgentId: agent.id, ...data }
  });
};


const checkAgentAccess = async (viewerId: string, careReceiverId?: string, assignmentId?: string) => {
  // Step 1: Find CareAgent profile using User.id
  const agent = await prisma.careAgent.findUnique({
    where: {
      userId: viewerId
    }
  });

  if (!agent) {
    throw new NotFoundError("Care Agent profile not found");
  }

  // Step 2: Verify assignment exists
  let assignment
  if (careReceiverId) {

    assignment = await prisma.careAssignment.findUnique({
      where: {
        careAgentId_careReceiverId: {
          careReceiverId,
          careAgentId: agent.id
        }
      }
    });
  }

  if (assignmentId) {
    assignment = await prisma.careAssignment.findFirst({
      where: {
        id: assignmentId,
        careAgentId: agent.id,
      },
    });
  }

  if (!assignment || assignment.status !== "ACTIVE") {
    throw new ForbiddenError(
      "Unauthorized: You are not assigned to this patient."
    );
  }
}

const visitHistoryAuthorization = async (viewerId: string, role: string, careReceiverId: string) => {

  // 1. Authorization Logic
  if (role === 'CLIENT') {
    // Verify this parent belongs to this client
    const ownership = await prisma.careReceiver.findFirst({
      where: { id: careReceiverId, clientId: viewerId }
    });
    if (!ownership) throw new Error("Unauthorized: This is not your family record.");
  }

  else if (role === 'CARE_AGENT') {
    await checkAgentAccess(viewerId, careReceiverId, undefined)
  }
}

/**
 * GET Visit History
 * Fetches all logs for a specific parent.
 */
export const getVisitHistory = async (viewerId: string, role: string, careReceiverId: string, visitId?: string) => {
  await visitHistoryAuthorization(viewerId, role, careReceiverId)

  let filter: Prisma.VisitLogWhereInput = {}

  if (visitId) {
    filter.id = visitId
  }


  // 3. If Admin or authorized, return the logs
  return await prisma.visitLog.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    select: {
      assignmentId: true,
      careAgentId: true,
      scheduledAt: true,
      checkInAt: true,
      checkOutAt: true,
      status: true,
      bloodPressureSystolic: true,
      bloodPressureDiastolic: true,
      pulseRate: true,
      temperature: true,
      oxygenSaturation: true,
      weight: true,
      bloodSugar: true,
      respiratoryRate: true,
      painLevel: true,
      mood: true,

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


export const getVisitLogById = async (viewerId: string, role: string, visitId: string) => {
  const visit = await prisma.visitLog.findUnique({
    where: {
      id: visitId
    },
  });

  if (!visit) {
    throw new NotFoundError(
      "Visit not found"
    );
  }

  await checkAgentAccess(
    viewerId,
    undefined,
    visit.assignmentId
  );


  return visit;

};

