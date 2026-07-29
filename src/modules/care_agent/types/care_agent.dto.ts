import { z } from "zod";
import { CareAgent, User } from "@prisma/client";

const optionalString = z.string().optional().or(z.literal(""));


export const CreateCareAgentSchema = z.object({
  // User Account Part
    name: z.string().min(2, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),

    // CareAgent Profile Part
    phone: z.string().min(10, "Valid phone number is required"),
    secondaryPhone: optionalString,
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z.coerce.date(), // Automatically converts string to Date object

    qualification: z.string().min(2, "Qualification is required"),
    specialization: optionalString,
    experience: z.coerce.number().int().min(0),

    // Address Part
    city: z.string().min(2, "City is required"),
    district: optionalString,
    ward: z.string().min(1, "Ward is required"),
    tole: z.string().min(1, "Tole/Street is required"),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),

    // Optional Documents
    citizenshipNo: z.string().optional(),
    licenseNo: optionalString,
});

export type RegisterCareAgentResult = {
  user: User;
  careAgent: CareAgent;
  tempPassword: string;
};

export const UpdateCareAgentSchema =
  CreateCareAgentSchema
    .omit({
      email: true,
      password: true,
    })
    .partial();

export type CreateCareAgentDTO = z.infer<typeof CreateCareAgentSchema>;