import { z } from "zod";

export const CreateCareAssignmentSchema = z.object({
    // ── Core relations ──
    careAgentId:    z.string().uuid("Invalid care agent ID"),
    careReceiverId: z.string().uuid("Invalid care receiver ID"),

    // ── Timing ──
    startDate: z.coerce.date(),
    endDate:   z.coerce.date().optional(),

    // ── Details ──
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]).default("ACTIVE"),
    notes:  z.string().optional(),
})
.refine(
    (data) => {
        if (data.endDate) {
            return data.endDate > data.startDate;
        }
        return true;
    },
    { message: "End date must be after start date", path: ["endDate"] }
);

export const UpdateCareAssignmentSchema = CreateCareAssignmentSchema
    .omit({ careAgentId: true, careReceiverId: true })
    .partial();

export type CreateCareAssignmentDTO = z.infer<typeof CreateCareAssignmentSchema>;
export type UpdateCareAssignmentDTO = z.infer<typeof UpdateCareAssignmentSchema>;