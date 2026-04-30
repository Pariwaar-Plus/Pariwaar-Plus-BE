import prisma from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import { Role } from "@prisma/client";
import { ClientDTO } from "../../@types/index";
import crypto from "crypto";
import { sendWelcomeEmail } from "../../utils/email.util";
import { Gender, Relationship } from "@prisma/client";


export const registerClient = async (adminId: string, clientData: ClientDTO) => {
    // 1. Verify Admin permissions
    const admin = await prisma.user.findUnique({
        where: { id: adminId }
    });

    if (!admin || admin.role !== Role.ADMIN) {
        throw new Error("Unauthorized: Only admin can register clients");
    }

    // 2. Check if client email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: clientData.email },
    });

    if (existingUser) throw new Error("A user with this email already exists");

    // 3. Hash a temporary password
    const tempPassword = clientData.password || crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(tempPassword);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Step A: Create the base User
            const user = await tx.user.create({
                data: {
                    name: clientData.name,
                    email: clientData.email,
                    password: hashedPassword,
                    role: Role.CLIENT,
                },
            });

            // Step B: Create the Client Profile
            const client = await tx.client.create({
                data: {
                    userId: user.id,
                    country: clientData.country,
                    city: clientData.city,
                    contact: clientData.phone,
                    address: clientData.address,
                },
            });

            return { 
                user: { id: user.id, name: user.name, email: user.email }, 
                client 
            };
        });

        // 4. Post-Transaction: Send Email
        try {
            await sendWelcomeEmail(result.user.email, result.user.name, tempPassword);
        } catch (error) {
            console.error("Welcome email failed to send:", error);
        }

        return {
            ...result,
            tempPassword // Returned to Admin as a backup
        };
    } catch (e: any) {
        if (e.code === "P2002") {
            throw new Error("A user with this email already exists");
        }
        throw e;
    }
};


/**
 * For the Client: Find by User ID (from the JWT)
 */
export const getFamilyByClientId = async (userId: string) => {
  // We search by userId because the Client (child) logs in with their User account
    const clientWithParents = await prisma.client.findUnique({
    where: { userId },
    include: {
        careReceivers: true // This matches the relation name in your Prisma schema
    }
    });

    if (!clientWithParents) throw new Error("Family account not found for this user");
    return clientWithParents;
};

/**
 * For the Admin: Find by Client Profile ID (from the URL param)
 */
export const getFamilyByProfileId = async (profileId: string) => {
    const client = await prisma.client.findUnique({
    where: { id: profileId },
    include: { 
        careReceivers: true,
        user: { select: { name: true, email: true } } 
    }
    });
    if (!client) throw new Error("Client profile not found");
    return client;
};

/**
 * ADD Parent to existing Family
 * Allows adding another parent to an existing client account
 */
export const addParentToFamily = async (clientId: string, parentData: any) => {
    // 1. Verify client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client profile not found.");

    // 2. Create the new Care Receiver with data sanitization

    try {
        // 2. Create the new Care Receiver
        return await prisma.careReceiver.create({
            data: {
                clientId: client.id,
                name: parentData.name,
                age: parseInt(parentData.age, 10),
                
                // Use Enum casting to ensure data matches the schema
                gender: parentData.gender as Gender, 
                relationship: parentData.relationship as Relationship || null,
                
                city: parentData.city,
                ward: parentData.ward || null,
                tole: parentData.tole || null,
                contactNumber: parentData.contactNumber,
                
                medicalHistory: parentData.medicalHistory || null,
                existingConditions: Array.isArray(parentData.existingConditions) 
                    ? parentData.existingConditions 
                    : [],
            }
        });
    } catch (error: any) {
        // Handle database-level errors (e.g., unique constraints)
        console.error("Error creating CareReceiver:", error);
        throw new Error("Failed to save parent profile. Please check the data.");
    }
};


/**
 * ADMIN: Assign a Care Agent to a Parent
 */
export const assignAgentToParent = async (careAgentId: string, careReceiverId: string) => {
  // The @@unique constraint in Prisma will throw an error if this already exists,
  // but checking manually allows for a cleaner error message.

    const agent = await prisma.careAgent.findUnique({
    where: { id: careAgentId }
    });

    if (!agent) {
    throw new Error("Care Agent not found");
    }

    const receiver = await prisma.careReceiver.findUnique({
    where: { id: careReceiverId }
    });

    if (!receiver) {
    throw new Error("Care Receiver not found");
    }
    
    const existing = await prisma.careAssignment.findUnique({
    where: {
        careReceiverId_careAgentId: {
        careReceiverId,
        careAgentId
        }
    }
    });

    if (existing) throw new Error("This agent is already assigned to this parent.");

    return await prisma.careAssignment.create({
    data: {
        careAgentId,
        careReceiverId,
        status: 'ACTIVE'
    },
    include: {
        careReceiver: { select: { name: true } },
        careAgent: { include: { user: { select: { name: true } } } }
    }
    });
};