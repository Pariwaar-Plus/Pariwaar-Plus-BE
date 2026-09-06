import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import * as notificationController from "./notification.controller";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Care Agent logs the actual visit data

router.use(authMiddleware)
router.post(
    "/",
    authorizeRoles(Role.CARE_AGENT,Role.ADMIN),
    notificationController.create
);

router.get(
    "/",
    notificationController.getAll
);

router.get("/unread", notificationController.getUnread);

router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id", notificationController.update);


// router.delete("/:id", notificationController.remove);

export default router;
