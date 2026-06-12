import express from "express";

import { Role } from "@prisma/client"; // Import the Enum
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { createCareAssignment, deleteCareAssignmment, getAssignmentByCareReceiver } from "./care_assignment.controller";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  createCareAssignment
);


router.get(
  "/",
  authMiddleware,
  getAssignmentByCareReceiver
);


router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.ADMIN), // Ensure only Admins can hit this
  deleteCareAssignmment
);

export default router;