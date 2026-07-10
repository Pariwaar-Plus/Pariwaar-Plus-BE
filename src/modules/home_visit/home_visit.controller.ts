import { Request, Response } from "express";
import * as homeVisitService from "./home_visit.service";
import { AuthRequest } from "../../@types";
import { CreateVisitLogSchema } from "./types/visit_log.dto";

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

export const getHistory = async (req: Request, res: Response) => {
    try {
        const authReq = req as unknown as AuthRequest;
        const careReceiverId = req.params.careReceiverId as string;
        const visitId = req.query.visitId as string

        const history = await homeVisitService.getVisitHistory(
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


