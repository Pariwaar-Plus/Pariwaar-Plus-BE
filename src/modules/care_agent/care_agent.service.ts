import prisma from "../../config/prisma";

/**
 * Get all care agents
 * Useful for Admin dashboards or Client browsing
 */
export const getAllCareAgents = async () => {
  return prisma.careAgent.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
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