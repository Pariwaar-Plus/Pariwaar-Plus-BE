import { AssignmentFrequency, CareAssignment, CareAssignmentSchedule, Role, User, VisitLog } from "../../generated/prisma";
import prisma from "../../config/prisma";
import { getVisitByAssignmentAndSchedule } from "../home_visit/home_visit.service";
import { CreateCareAssignmentDTO, UpdateCareAssignmentDTO } from "./types/care_assignment.dto";
import { es } from "zod/locales";
import { NotFoundError } from "../../../lib/error/NotfoundError";
import { getCareAgentByUserId } from "../care_agent/care_agent.service";

export const createCareAssignment = async (
  data: CreateCareAssignmentDTO
) => {
  const {
    careAgentId,
    careReceiverId,
    frequency,
    startDate: newStartDate,
    endDate: newEndDate,
    notes,
  } = data;

  // Optional: validate existence (recommended in real apps)
  const [agent, receiver] = await Promise.all([
    prisma.careAgent.findUnique({ where: { id: careAgentId } }),
    prisma.careReceiver.findUnique({ where: { id: careReceiverId } }),
  ]);

  if (!agent) {
    throw new Error("Care agent not found");
  }

  if (!receiver) {
    throw new Error("Care receiver not found");
  }



  await prisma.$transaction(async (tx) => {
    const overlap = await tx.careAssignmentSchedule.findFirst({
      where: {
        assignment: {
          careAgentId,
          careReceiverId,
        },
        startDate: { lte: newEndDate },
        endDate: { gte: newStartDate },
      },
    });

    if (overlap) {
      throw new Error(
        "An assignment already exists for this agent and receiver in the selected date range."
      );
    }

    const assignment = await tx.careAssignment.create({
      data: {
        careAgentId,
        careReceiverId,
        status: "ACTIVE",
        notes,
      },
    });

    await tx.careAssignmentSchedule.create({
      data: {
        assignmentId: assignment.id,
        startDate: newStartDate,
        endDate: newEndDate,
        frequency,
      },
    });

    return assignment;
  });
};

const getScheduleData = async (assignments: CareAssignment[]) => {
  const now = new Date();
  const assignmentIds = assignments.map((a) => a.id)
  //fetch all schedules
  const schedules = await prisma.careAssignmentSchedule.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      deletedAt: null,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    orderBy: {
      startDate: "desc",
    },
  });

  const scheduleMap = new Map<string, CareAssignmentSchedule>();

  for (const s of schedules) {
    if (!scheduleMap.has(s.assignmentId)) {
      scheduleMap.set(s.assignmentId, s);
    }
  }

  //fetch visited dates
  const visits = await getVisitByAssignmentAndSchedule(assignmentIds, now)

  const visitMap = new Map<string, VisitLog[]>();

  for (const visit of visits) {
    const arr = visitMap.get(visit.assignmentId) ?? [];
    arr.push(visit);
    visitMap.set(visit.assignmentId, arr);
  }

  const result = assignments.map((a) => {
    const schedule = scheduleMap.get(a.id);
    const assignmentVisits = visitMap.get(a.id) ?? [];
    const existingVisits = new Set(
      assignmentVisits.map(v => v.scheduledAt.toISOString().split("T")[0])
    );

    const nextVisit = generateNextVisits(
      schedule!,
      existingVisits,
      now,
      1
    );

    return {
      ...a,
      schedule: {
        frequency: schedule?.frequency,
        nextVisit,
      }
    };
  });

  return result

}

function getNextDate(date: Date, frequency: AssignmentFrequency) {
  const d = new Date(date);

  switch (frequency) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;

    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;

    case "BIWEEKLY":
      d.setDate(d.getDate() + 14);
      break;

    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
  }

  return d;
}

function generateNextVisits(schedule: CareAssignmentSchedule, visitedSet: Set<string>, fromDate: Date, limit: number) {
  const result = [];


  let currentDate = new Date(fromDate);
  currentDate.setDate(currentDate.getDate() + 1)


  let cursor = new Date(
    Math.max(currentDate.getTime(), schedule.startDate.getTime())
  );

  while (
    cursor <= (schedule.endDate ?? Infinity) &&
    result.length < limit
  ) {
    const key = cursor.toISOString();

    if (!visitedSet.has(key)) {
      result.push({
        scheduledDate: new Date(cursor),
        assignmentId: schedule.assignmentId,
        status: "SCHEDULED"
      });
    } else {
      //TODO
    }

    cursor = getNextDate(cursor, schedule.frequency);
  }

  // if (result.length >= limit) break;

  return result.slice(0, limit);
}

function generateNextVisit(
  schedule: CareAssignmentSchedule,
  now: Date,
): Date | null {
  let cursor = new Date(schedule.startDate);

  // Advance until the occurrence is today or in the future
  while (cursor < now) {
    cursor = getNextDate(cursor, schedule.frequency);
  }

  if (schedule.endDate && cursor > schedule.endDate) {
    return null;
  }

  return cursor;
}

export const getAssignmentByCareReceiver = async (
  user: any,
  careReceiverId: string
) => {
  let filter: any = {};
  if (user) {

    if (user.role === Role.ADMIN) {
      if (careReceiverId) {
        filter.careReceiverId = careReceiverId;
      }
    }

    if (user.role === Role.CARE_AGENT) {
      const careAgent = await getCareAgentByUserId(user.id)
      if (careAgent) {
        filter.careAgentId = careAgent.id
      }
    }

  }

  const assignments = await prisma.careAssignment.findMany({
    where: {
      ...filter,
      status: "ACTIVE",
      deletedAt: null
    },

    include: {
      careAgent: { select: { user: { select: { name: true, email: true } }, employeeId: true } },
      careReceiver: { select: { name: true, city: true } },
    },
  });
  const now = new Date()

  const schedules = await prisma.careAssignmentSchedule.findMany({
    where: {
      assignmentId: {
        in: assignments.map(a => a.id),
      },
      deletedAt: null,
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  });
  const scheduleMap = new Map(
    schedules.map(s => [s.assignmentId, s])
  );

  const assignmentIds = assignments.map(a => a.id);

  // const recentVisits = await prisma.$queryRaw`
  //   SELECT *
  //   FROM (
  //     SELECT
  //       v.*,
  //       ROW_NUMBER() OVER (
  //         PARTITION BY v."assignmentId"
  //         ORDER BY v."visitedAt" DESC
  //       ) as rn
  //     FROM "Visit" v
  //     WHERE
  //       v."status" = 'COMPLETED'
  //       AND v."deletedAt" IS NULL
  //       AND v."assignmentId" = ANY(${assignmentIds})
  //   ) ranked
  //   WHERE rn <= 4;
  // `;

  const visits = await prisma.visitLog.findMany({
    where: {
      assignmentId: {
        in: assignments.map(a => a.id),
      },
      // status: "COMPLETED",
      deletedAt: null,
    },
    orderBy: {
      scheduledAt: "desc",
    },
  });

  const visitMap = new Map<string, VisitLog[]>();

  for (const visit of visits) {
    const arr = visitMap.get(visit.assignmentId) ?? [];

    if (arr.length < 4) {
      arr.push(visit);
    }

    visitMap.set(visit.assignmentId, arr);
  }
  return assignments.map(assignment => {
    const schedule = scheduleMap.get(assignment.id);

    return {
      ...assignment,

      schedule: {
        frequency: schedule?.frequency,
        nextVisit: schedule
          ? generateNextVisit(schedule, now)
          : null,
        recentVisits: visitMap.get(assignment.id) ?? [],
        startDate: schedule?.startDate,
        endDate: schedule?.endDate
      }

    };
  });
  // const scheduleData = await getScheduleData(assignments)
  // return scheduleData

};

export const updateCareAssignment = async (assignmentId: string, data: UpdateCareAssignmentDTO) => {
  const existing = await prisma.careAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Care assignment not found");
  }


  const result = await prisma.$transaction(async (tx) => {

    let resultSchedule

    const schedule = await tx.careAssignmentSchedule.findFirst({
      where: {
        assignmentId,
        deletedAt: null,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });

    if (!schedule) {
      throw new NotFoundError("Active schedule not found");
    }


    // frequency changed
    if (
      data.frequency &&
      data.frequency !== schedule.frequency
    ) {

      await tx.careAssignmentSchedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          endDate: new Date(),
        },
      });


      resultSchedule = await tx.careAssignmentSchedule.create({
        data: {
          assignmentId,
          startDate: data.startDate ?? new Date(),
          endDate: data.endDate
            ? new Date(data.endDate)
            : null,
          frequency: data.frequency,
        },
      });

      await tx.visitLog.updateMany({
        where: {
          assignmentId,
          scheduledAt: {
            gte: new Date()
          }
        },
        data: {
          deletedAt: new Date()
        }
      })


    }

    // only end date changed
    else if (data.endDate !== undefined) {

      resultSchedule = await tx.careAssignmentSchedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          endDate: new Date(data.endDate),
        },
      });


      await tx.visitLog.updateMany({
        where: {
          assignmentId,
          scheduledAt: {
            gt: new Date(data.endDate),
          },
        },
        data: {
          deletedAt: new Date()
        }
      })



    }


    // assignment fields
    // if (data.notes !== undefined) {
    const updated = await tx.careAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        ...(data.notes != undefined && { notes: data.notes }),
      },
    });
    // }
    return { ...updated, schedule: resultSchedule }
  });




  return result;
}


export const deleteCareAssignmment = async (careAssignmentId: string) => {
  // 1. Verify agent existence and get userId
  const assignment = await prisma.careAssignment.findUnique({
    where: { id: careAssignmentId },
  });

  if (!assignment) throw new NotFoundError("Care assignment not found");

  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    const assignment = await tx.careAssignment.update({
      where: {
        id: careAssignmentId,
      },
      data: {
        deletedAt: now,
      },
    });

    await tx.careAssignmentSchedule.updateMany({
      where: {
        assignmentId: assignment.id,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    });


  });
};