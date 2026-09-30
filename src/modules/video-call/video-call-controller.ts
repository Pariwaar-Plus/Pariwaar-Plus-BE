import { NextFunction, Request, Response } from "express";
import { createVideoCallService, joinVideoCallService } from "./video-call.service";
import { AuthRequest } from "../../@types";

export const createVideoCall = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const data = await createVideoCallService();

        return res.status(200).json({
            message: "Video call active",
            data
        });
    } catch (error) {
        next(error);
    }
};


export const joinVideoCall = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        const data = await joinVideoCallService(req.params.roomId as string,req?.user?.id as string);

        return res.status(200).json({
            message: "Video call active",
            data
        });
    } catch (error) {
        next(error);
    }
}