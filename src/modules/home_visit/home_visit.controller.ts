import { NextFunction, Request, Response } from "express";
import * as homeVisitService from "./home_visit.service";
import { AuthRequest } from "../../@types";
import { CreateVisitLogSchema, UpdateVisitLogSchema } from "./types/visit_log.dto";
import { ZodError } from "zod";
import { VisitStatus } from "@prisma/client";

export const logVisit = async (req: Request, res: Response) => {
    try {
        const authReq = req as unknown as AuthRequest;
        const userId = authReq.user!.id;

        const validatedData = CreateVisitLogSchema.parse(authReq.body);

        const visit = await homeVisitService.createVisitLog(userId, validatedData);

        res.status(201).json({
            success: true,
            message: "Visit log submitted successfully",
            data: visit
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: "Error occured while saving log. Please Try again"
        });
    }
};

export const getHistoryByCareReceiver = async (req: Request, res: Response) => {
    try {
        const authReq = req as unknown as AuthRequest;
        const careReceiverId = req.params.careReceiverId as string;
        const visitId = req.query.visitId as string

        const history = await homeVisitService.getHistoryByCareReceiver(
            authReq.user!.id,
            authReq.user!.role,
            careReceiverId,
            visitId
        );

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (err: any) {
        res.status(403).json({ success: false, message: err.message });
    }
};

// visit-log.controller.ts

export const getHistoryWithFilter = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const data = await homeVisitService.getVisitLogs({
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 10),

            careAgentId: req.query.careAgentId as string,
            careReceiverId: req.query.careReceiverId as string,

            status: req.query.status as VisitStatus,

            from: req.query.from as string,

            to: req.query.to as string,
        });
        res.status(200).json({
            success: true,
            data
        });

    } catch (err) {

        next(err);

    }

};



export const getVisitLogById = async (req: Request, res: Response) => {
    try {
        const authReq = req as unknown as AuthRequest;
        const visitLogId = req.params.visitLogId as string;

        const visit = await homeVisitService.getVisitLogById(
            authReq.user!.id,
            authReq.user!.role,
            visitLogId
        );

        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (err: any) {
        res.status(403).json({ success: false, message: err.message });
    }
};


export const updateVisitLog = async (req: AuthRequest, res: Response) => {
    try {
        /**
         * 1. Validate route param
         */
        const visitLogId = req.params.visitLogId as string;

        if (!visitLogId) {
            return res.status(400).json({
                success: false,
                message: "Visit Log ID is required",
            });
        }

        /**
         * 2. Validate request body
         */
        const validatedData = UpdateVisitLogSchema.parse(req.body);

        /**
         * 3. Call service layer
         */
        const updatedVisitLog = await homeVisitService.updateVisitLog(
            visitLogId,
            validatedData
        );

        /**
       * 4. Success response
       */
        return res.status(200).json({
            success: true,
            message: "Visit Log updated successfully",
            data: updatedVisitLog,
        });

    } catch (error: any) {

        console.log(error)
        /**
         * 1. Zod validation errors
         */
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues,
            });
        }

        /**
         * 2. Not found errors
         */
        if (
            typeof error.message === "string" && error.message.toLowerCase().includes("not found")
        ) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        /**
         * 3. Generic fallback
         */
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export const deleteVisitLog = async (req: AuthRequest, res: Response) => {

    const visitLogId = req.params.visitLogId as string;
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
        }

        await homeVisitService.deleteVisitLog(visitLogId);

        return res.status(200).json({
            success: true,
            message: "Visit Log have been deleted.",
        });
    } catch (err: any) {
        return res.status(400).json({
            success: false,
            message: err.message || "Failed to delete visit log",
        });
    }
};




