import prisma from "../../config/prisma";
import { CreateCareAssignmentDTO } from "./types/care_assignment.dto";

export const createCareAssignment = async (
  data: CreateCareAssignmentDTO
) => {
  const {
    careAgentId,
    careReceiverId,
    status = "ACTIVE",
    startDate,
    endDate,
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

  // Optional business rule: prevent duplicate ACTIVE assignment
  const existingActive = await prisma.careAssignment.findFirst({
    where: {
      careAgentId,
      careReceiverId,
      status: "ACTIVE",
    },
  });

  if (existingActive) {
    throw new Error("Active assignment already exists");
  }

  // Create assignment
  return await prisma.careAssignment.create({
    data: {
      careAgentId,
      careReceiverId,
      status,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      notes,
    },
    include: {
      careAgent: true,
      careReceiver: true,
    },
  });
};

export const getAssignmentByCareReceiver = async (
  careReceiverId: string
) => {
  return await prisma.careAssignment.findMany({
    where: {
      careReceiverId,
      status: "ACTIVE",
      deletedAt: null
    },
    orderBy: {
      startDate: "desc",
    },
    include: {
      careAgent: { include: { user: { select: { name: true, email: true } } } },
      careReceiver: true,
    },
  });
};


export const deleteCareAssignmment = async (careAssignmentId: string) => {
  // 1. Verify agent existence and get userId
  const assignment = await prisma.careAssignment.findUnique({
    where: { id: careAssignmentId },
  });

  if (!assignment) throw new Error("Care assignment not found");

  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.careAssignment.update({
      where: { id: careAssignmentId },
      data: { deletedAt: now },
    });

  });
};