import { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/error/error";

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.log(err)
    if (err instanceof AppError) {
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
    return;
    }

    // Unexpected errors — don't leak internals
    console.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
    });
};