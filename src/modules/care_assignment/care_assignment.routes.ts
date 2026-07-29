import express from "express";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { createCareAssignment, deleteCareAssignmment, getAssignmentByCareReceiver, updateCareAssignment } from "./care_assignment.controller";
import { Role } from "../../generated/prisma";

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

router.patch("/:assignmentId", 
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  updateCareAssignment
);



router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.ADMIN), // Ensure only Admins can hit this
  deleteCareAssignmment
);

export default router;