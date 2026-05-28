import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));

export const CreateCareReceiverSchema = z.object({
    // ── Core relation ──
    clientId: z.string().uuid("Invalid client ID"),

    // ── Personal ──
    name:        z.string().min(2, "Name is required"),
    dateOfBirth: z.coerce.date(),
    gender:      z.enum(["MALE", "FEMALE", "OTHER"]),

    // ── Contact & Location (in Nepal) ──
    phone:    optionalString,
    city:     z.string().min(2, "City is required"),
    district: optionalString,
    ward:     z.string().min(1, "Ward is required"),
    tole:     z.string().min(1, "Tole is required"),

    // ── Medical Info ──
    bloodGroup:       optionalString,
    medicalCondition: optionalString,
    allergies:        optionalString,
    mobilityStatus:   z.enum([
        "INDEPENDENT",
        "ASSISTED",
        "WHEELCHAIR",
        "BEDRIDDEN",
        ]).default("INDEPENDENT"),
    notes: optionalString,

    // ── Emergency Contact ──
    emergencyContactName:  optionalString,
    emergencyContactPhone: optionalString,
});

export const UpdateCareReceiverSchema = CreateCareReceiverSchema
    .omit({ clientId: true })
    .partial();

export type CreateCareReceiverDTO = z.infer<typeof CreateCareReceiverSchema>;
export type UpdateCareReceiverDTO = z.infer<typeof UpdateCareReceiverSchema>;