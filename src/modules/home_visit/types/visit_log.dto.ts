import { z } from "zod";

const optionalInt = z.coerce.number().int().optional();
const optionalFloat = z.coerce.number().optional();

export const CreateVisitLogSchema = z.object({
    // ── Core ──
    assignmentId: z.uuid(),
    // careAgentId: z.uuid(),
    scheduledAt: z.coerce.date(),
    checkInAt: z.coerce.date().optional(),
    checkOutAt: z.coerce.date().optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"]).default("SCHEDULED"),
    cancellationReason: z.string().optional(),

    // ── Vitals ──
    bloodPressureSystolic: optionalInt,
    bloodPressureDiastolic: optionalInt,
    pulseRate: optionalInt,
    temperature: optionalFloat,
    oxygenSaturation: optionalFloat,
    weight: optionalFloat,
    bloodSugar: optionalFloat,
    respiratoryRate: optionalInt,

    // ── Pain & Wellbeing ──
    painLevel: z.coerce.number().int().min(0).max(10).optional(),
    mood: z.enum(["HAPPY", "CALM", "ANXIOUS", "CONFUSED", "AGITATED", "DEPRESSED"]).optional(),

    // ── Medications ──
    medicationsGiven: z.string().optional(),
    medicationsSkipped: z.string().optional(),

    // ── Clinical ──
    symptoms: z.string().optional(),
    woundCare: z.string().optional(),
    woundCondition: z.enum(["HEALING", "STABLE", "WORSENING", "INFECTED", "NOT_APPLICABLE"]).optional(),

    // ── Mobility ──
    mobilityAssessment: z.enum(["INDEPENDENT", "ASSISTED", "WHEELCHAIR", "BEDRIDDEN"]).optional(),
    mobilityNotes: z.string().optional(),

    // ── Notes ──
    agentNotes: z.string().optional(),
    adminNotes: z.string().optional(),
})
    .refine(
        (data) => {
            if (data.checkInAt && data.checkOutAt) {
                return data.checkOutAt > data.checkInAt;
            }
            return true;
        },
        { message: "Check-out must be after check-in", path: ["checkOutAt"] }
    )
    .refine(
        (data) => {
            if (data.status === "MISSED" || data.status === "CANCELLED") {
                return !!data.cancellationReason;
            }
            return true;
        },
        { message: "Cancellation reason required for missed or cancelled visits", path: ["cancellationReason"] }
    );

export const UpdateVisitLogSchema = z.object(CreateVisitLogSchema.shape)
    .omit({ assignmentId: true})
    .partial();

export type CreateVisitLogDTO = z.infer<typeof CreateVisitLogSchema>;
export type UpdateVisitLogDTO = z.infer<typeof UpdateVisitLogSchema>;