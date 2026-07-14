import { Prisma, Role } from "@prisma/client";
import prisma from "../../config/prisma";
import { CreateVisitLogDTO, UpdateVisitLogDTO } from "./types/visit_log.dto";
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

  return assignment.id
}

const visitHistoryAuthorization = async (viewerId: string, role: string, careReceiverId: string) => {

  // 1. Authorization Logic
  if (role === 'CLIENT') {

    const client = await prisma.client.findUnique({
      where: {
        userId: viewerId
      }
    });

    if (!client) {
      throw new NotFoundError("Client profile not found");
    }
    // Verify this parent belongs to this client
    const ownership = await prisma.careReceiver.findFirst({
      where: { id: careReceiverId, clientId: client.id }
    });
    if (!ownership) throw new ForbiddenError("Unauthorized: This is not your family record.");
  }

  else if (role === 'CARE_AGENT') {
    const assignmentId = await checkAgentAccess(viewerId, careReceiverId, undefined)
    return assignmentId
  }
}

/**
 * GET Visit History
 * Fetches all logs for a specific parent.
 */
export const getHistoryByCareReceiver = async (viewerId: string, role: string, careReceiverId: string, visitId?: string) => {
  const assignmentId = await visitHistoryAuthorization(viewerId, role, careReceiverId)

  let filter: Prisma.VisitLogWhereInput = {}

  // filter.careAgentId = viewerId

  if (assignmentId) {
    filter.assignmentId = assignmentId
  }

  if (visitId) {
    filter.id = visitId
  }


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
      deletedAt: null
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
      id: visitId,
      deletedAt: null
    },
    include: {
      careAgent: { select: { user: { select: { id: true, name: true } } } },
      assignment: { select: { careReceiver: { select: { name: true, id: true } } } },
    }
  });

  if (!visit) {
    throw new NotFoundError(
      "Visit not found"
    );
  }

  if (role !== Role.ADMIN) {

    await checkAgentAccess(
      viewerId,
      undefined,
      visit.assignmentId
    );
  }
  return visit;
};

function buildGroupedResponse(
  visits: any,
  page: number,
  limit: number
) {

  const grouped = new Map();

  for (const visit of visits) {

    const receiver =
      visit.assignment.careReceiver;

    if (!grouped.has(receiver.id)) {

      grouped.set(receiver.id, {

        careReceiver: {

          id: receiver.id,

          name: receiver.name,

          city: receiver.city,

        },

        totalVisits: 0,

        completedVisits: 0,

        missedVisits: 0,

        cancelledVisits: 0,

        lastVisit: null,

        recentVisits: [],

      });

    }

    const group =
      grouped.get(receiver.id);

    group.totalVisits++;

    if (visit.status === "COMPLETED")
      group.completedVisits++;

    if (visit.status === "MISSED")
      group.missedVisits++;

    if (visit.status === "CANCELLED")
      group.cancelledVisits++;

    if (!group.lastVisit) {

      group.lastVisit = visit.visitedAt;

    }

    if (group.recentVisits.length < 3) {

      group.recentVisits.push({

        id: visit.id,

        status: visit.status,

        duration: visit.duration,

        visitedAt: visit.visitedAt,

        careAgent: {

          id: visit.assignment.careAgent.id,

          name:
            visit.assignment.careAgent.user
              .name,

        },

      });

    }

  }

  const result =
    [...grouped.values()];

  const total =
    result.length;

  const start =
    (page - 1) * limit;

  return {

    data: result.slice(
      start,
      start + limit
    ),

    pagination: {

      page,

      limit,

      total,

      totalPages: Math.ceil(
        total / limit
      ),

    },

  };

}

// export async function getVisitLogs(filters: any) {

//   
//   const visits = await prisma.visitLog.findMany({

//     where,

//     include: {

//       assignment: {

//         include: {

//           careReceiver: true,

//           careAgent: {

//             include: {

//               user: true,

//             },

//           },

//         },

//       },

//     },

//     orderBy: {

//       scheduledAt: "desc",

//     },

//   });

//   return buildGroupedResponse(
//     visits,
//     filters.page,
//     filters.limit
//   );

// }


export const getVisitLogs = async (filters: any) => {

  const where: Prisma.VisitLogWhereInput = {};
  where.deletedAt = null

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.careAgentId) {
    where.careAgentId = filters.careAgentId
  }

  if (filters.careReceiverId) {
    where.assignment = {
      careReceiverId: filters.careReceiverId,
    };
  }


  if (filters.from || filters.to) {
    where.scheduledAt = {};
    if (filters.from) {
      where.scheduledAt.gte = new Date(filters.from);
    }

    if (filters.to) {
      where.scheduledAt.lte = new Date(filters.to);
    }

  }

  const visits = await prisma.visitLog.findMany({
    where,
    include: {
      careAgent: {
        include: {
          user: true,
        },
      },
      assignment: {
        include: {
          careReceiver: true,

        },
      },
    },
    orderBy: {
      scheduledAt: "desc",
    },
  });


  return visits
}

export const updateVisitLog = async (
  visitLogId: string,
  data: UpdateVisitLogDTO
) => {

  const existing = await prisma.visitLog.findUnique({
    where: {
      id: visitLogId,
      deletedAt: null
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });


  if (!existing || existing.deletedAt) {
    throw new NotFoundError(
      "Visit log not found"
    );
  }



  const updated = await prisma.visitLog.update({

    where: {
      id: visitLogId,
      deletedAt: null
    },

    data: {
      ...(data.scheduledAt !== undefined && {
        scheduledAt: new Date(data.scheduledAt),
      }),


      ...(data.checkInAt !== undefined && {
        checkInAt: data.checkInAt
          ? new Date(data.checkInAt)
          : null,
      }),


      ...(data.checkOutAt !== undefined && {
        checkOutAt: data.checkOutAt
          ? new Date(data.checkOutAt)
          : null,
      }),


      ...(data.status !== undefined && {
        status: data.status,
      }),


      ...(data.cancellationReason !== undefined && {
        cancellationReason: data.cancellationReason,
      }),



      // Vitals

      ...(data.bloodPressureSystolic !== undefined && {
        bloodPressureSystolic:
          data.bloodPressureSystolic,
      }),

      ...(data.bloodPressureDiastolic !== undefined && {
        bloodPressureDiastolic:
          data.bloodPressureDiastolic,
      }),

      ...(data.pulseRate !== undefined && {
        pulseRate: data.pulseRate,
      }),

      ...(data.temperature !== undefined && {
        temperature: data.temperature,
      }),

      ...(data.oxygenSaturation !== undefined && {
        oxygenSaturation:
          data.oxygenSaturation,
      }),

      ...(data.weight !== undefined && {
        weight: data.weight,
      }),

      ...(data.bloodSugar !== undefined && {
        bloodSugar: data.bloodSugar,
      }),

      ...(data.respiratoryRate !== undefined && {
        respiratoryRate: data.respiratoryRate,
      }),



      // Wellbeing

      ...(data.painLevel !== undefined && {
        painLevel: data.painLevel,
      }),

      ...(data.mood !== undefined && {
        mood: data.mood,
      }),



      // Medication

      ...(data.medicationsGiven !== undefined && {
        medicationsGiven:
          data.medicationsGiven,
      }),

      ...(data.medicationsSkipped !== undefined && {
        medicationsSkipped:
          data.medicationsSkipped,
      }),



      // Clinical

      ...(data.symptoms !== undefined && {
        symptoms: data.symptoms,
      }),

      ...(data.woundCare !== undefined && {
        woundCare: data.woundCare,
      }),

      ...(data.woundCondition !== undefined && {
        woundCondition: data.woundCondition,
      }),



      // Mobility

      ...(data.mobilityAssessment !== undefined && {
        mobilityAssessment:
          data.mobilityAssessment,
      }),

      ...(data.mobilityNotes !== undefined && {
        mobilityNotes:
          data.mobilityNotes,
      }),



      // Notes

      ...(data.agentNotes !== undefined && {
        agentNotes: data.agentNotes,
      }),

    },

    include: {
      assignment: true,
    }

  });


  return updated;
};


export const deleteVisitLog = async (visitLogId: string) => {
  // 1. Verify agent existence and get userId
  const visit = await prisma.visitLog.findUnique({
    where: { id: visitLogId, deletedAt: null },
  });

  if (!visit) throw new NotFoundError("Visit Log not found");

  await prisma.visitLog.update({
    where: {
      id: visitLogId
    },
    data: {
      deletedAt: new Date()
    }
  })
};