import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));

export const CreateClientSchema = z.object({
    // ── User Account ──
    name:     z.string().min(2, "Name is required"),
    email:    z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),

    // ── Contact ──
    phone:          z.string().min(7, "Valid phone number required"),
    countryCode:    z.string().min(2, "Country code is required"),  // e.g. "+1"
    secondaryPhone: optionalString,

    // ── Location (abroad) ──
    country:  z.string().min(2, "Country is required"),
    timezone: z.string().min(2, "Timezone is required"),  // IANA e.g. "America/New_York"
    address:  optionalString,
    city:     optionalString,

    // ── Billing ──
    billingType:   z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
    paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING"),
});

export const UpdateClientSchema = CreateClientSchema
    .omit({ email: true, password: true })
    .partial();

export type CreateClientDTO = z.infer<typeof CreateClientSchema>;
export type UpdateClientDTO = z.infer<typeof UpdateClientSchema>;