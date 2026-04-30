import { Request, Response } from "express";
import * as homeVisitService from "./home_visit.service";
import { AuthRequest } from "../../@types";

export const logVisit = async (req: Request, res: Response) => {
    try {
    const authReq = req as unknown as AuthRequest;
    const userId = authReq.user!.id;

    const visit = await homeVisitService.createVisitLog(userId, authReq.body);

    res.status(201).json({
        success: true,
        message: "Visit log submitted successfully",
        data: visit
    });
    } catch (err: any) {
    res.status(400).json({
        success: false,
        message: err.message
    });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
    const authReq = req as unknown as AuthRequest;
    const careReceiverId = req.params.careReceiverId as string;

    const history = await homeVisitService.getVisitHistory(
        authReq.user!.id, 
        authReq.user!.role, 
        careReceiverId
    );

    res.status(200).json({
        success: true,
        data: history
    });
    } catch (err: any) {
    res.status(403).json({ success: false, message: err.message });
    }
};