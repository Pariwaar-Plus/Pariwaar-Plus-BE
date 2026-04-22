import prisma from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import { Role } from "@prisma/client";
import { CreateFamilyAccountDTO } from "../../@types/index";
import crypto from "crypto";
import { sendWelcomeEmail } from "../../utils/email.util";

export const createFamilyAccount = async (adminId: string, data: CreateFamilyAccountDTO) => {

    const admin = await prisma.user.findUnique({
        where: { id: adminId }
    });

    if (!admin || admin.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Only admin can create family accounts");
    }
    const { clientData, parentsData } = data;

    if (!parentsData || parentsData.length === 0) {
        throw new Error("At least one care receiver is required");
    }

  // 1. Check if client email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: clientData.email },
    });

    if (existingUser) throw new Error("A user with this email already exists");

  // 2. Hash a temporary password for the client (they can reset it later)
    const tempPassword = clientData.password || crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(tempPassword);

    try{
    const result = await prisma.$transaction(async (tx) => {
        // Step A: Create the base User for the Client
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

        // Step C: Create the Care Receiver (Parent) Profile
        // If you need the actual records returned, use Promise.all + tx.careReceiver.create
        const careReceivers = await Promise.all(
            parentsData.map((parent) => 
                (tx as any).careReceiver.create({
                    data: {
                        clientId: client.id,
                        name: parent.name,
                        age: parent.age,
                        gender: parent.gender,
                        city: parent.city,
                        ward: parent.ward,
                        tole: parent.tole,
                        contactNumber: parent.contactNumber,
                        medicalHistory: parent.medicalHistory,
                        existingConditions: parent.existingConditions,
                    }
                })
            )
        );

            return { 
                user: { id: user.id, name: user.name, email: user.email }, 
                client, 
                careReceivers,
            };
        });

        // 5. Post-Transaction: Communication [cite: 5]
        // Send email after the DB is confirmed so the user doesn't get a password for a failed account
        try {
            await sendWelcomeEmail(result.user.email, result.user.name, tempPassword);
        } catch (error) {
            // Log the error but don't crash the response; the Admin can manually give the password
            console.error("Welcome email failed to send:", error);
        }

        // Return the result (password omitted from user object automatically by Prisma if configured, 
        // or manually remove it here)
        // const { password, ...userSafe } = result.user;
        
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