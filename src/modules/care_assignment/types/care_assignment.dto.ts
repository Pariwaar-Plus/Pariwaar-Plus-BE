import { z } from "zod";

export const CreateCareAssignmentSchema = z.object({
    // ── Core relations ──
    careAgentId: z.uuid("Invalid care agent ID"),
    careReceiverId: z.uuid("Invalid care receiver ID"),

    // ── Timing ──
    startDate: z.coerce.date(),
    endDate: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.coerce.date().optional()
    ),
    frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "ON_DEMAND"]),
    // ── Details ──
    notes: z.string().optional(),
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

export const UpdateCareAssignmentSchema = z.object(CreateCareAssignmentSchema.shape)
    .omit({ careAgentId: true, careReceiverId: true })
    .partial();

export type CreateCareAssignmentDTO = z.infer<typeof CreateCareAssignmentSchema>;
export type UpdateCareAssignmentDTO = z.infer<typeof UpdateCareAssignmentSchema>;