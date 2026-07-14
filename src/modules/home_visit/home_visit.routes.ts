import { Router } from "express";
import * as homeVisitController from "./home_visit.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Care Agent logs the actual visit data
router.post(
    "/log",
    authMiddleware,
    authorizeRoles(Role.CARE_AGENT),
    homeVisitController.logVisit
);

// Admin, client, and care agent Views their own visit history
router.get(
    "/history/care-receiver/:careReceiverId",
    authMiddleware,
    // We allow all roles here, but the Service will filter ownership/assignments
    authorizeRoles(Role.ADMIN, Role.CLIENT, Role.CARE_AGENT),
    homeVisitController.getHistoryByCareReceiver
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles(Role.ADMIN),
    homeVisitController.getHistoryWithFilter
);


router.get(
    "/:visitLogId",
    authMiddleware,
    authorizeRoles(Role.ADMIN, Role.CLIENT, Role.CARE_AGENT),
    homeVisitController.getVisitLogById
);

router.patch("/:visitLogId", 
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  homeVisitController.updateVisitLog
);


router.delete(
  "/:visitLogId",
  authMiddleware,
  authorizeRoles(Role.ADMIN), // Ensure only Admins can hit this
  homeVisitController.deleteVisitLog
);


export default router;