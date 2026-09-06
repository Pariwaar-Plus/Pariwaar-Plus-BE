import { Request, Response, NextFunction } from "express";
import {
    createNotificationSchema,
    updateNotificationSchema,
} from "./types/notification.dto";
import {
    createNotification,
    getNotifications,
    getUnreadNotifications,
    updateNotification,
    markAllNotificationsAsRead,
    deleteNotification,
} from "./notification.service";
import { AuthRequest } from "../../@types";

export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = createNotificationSchema.parse(req.body);

        const notification = await createNotification(
            req.user?.id!,
            data
        );

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });
    } catch (error) {
        next(error);
    }
};


//get ALl by userId
export const getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const notifications = await getNotifications(req.user?.id!);
        return res.status(201).json({
            success: true,
            message: "Notification fetched successfully",
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const getUnread = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const notifications = await getUnreadNotifications(
            req.user?.id!
        );

        return res.status(201).json({
            success: true,
            message: "Notification fetched successfully",
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = updateNotificationSchema.parse(req.body);

        const result = await updateNotification(
            req.params.id as string,
            req.user?.id as string,
            data
        );

        if (result.count === 0) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            message: "Notification updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        await markAllNotificationsAsRead(req.user?.id as string);

        return res.status(200).json({
            message: "All notifications marked as read",
        });
    } catch (error) {
        next(error);
    }
};

// export const remove = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         const result = await deleteNotification(
//             req.params.id,
//             req.user.id
//         );

//         if (result.count === 0) {
//             return res.status(404).json({
//                 message: "Notification not found",
//             });
//         }

//         return res.status(204).send();
//     } catch (error) {
//         next(error);
//     }
// };