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


// ADMIN: Fetch all agent data for the dashboard
router.get(
  "/:careReceiverId",
  authMiddleware,
  authorizeRoles(Role.ADMIN),  
  getAssignmentByCareReceiver
);

// // CARE_AGENT: Fetch their own professional profile
// router.get(
//   "/me",
//   authMiddleware,
//   authorizeRoles(Role.CARE_AGENT), 
//   getMyProfile
// );

// // CARE_AGENT: Update profile details
// router.patch( 
//   "/me",
//   authMiddleware,
//   authorizeRoles(Role.CARE_AGENT), 
//   updateMyProfile
// );

// // Update Care Agent Details By admin
// router.patch("/:careAgentId", 
//   authMiddleware,
//   authorizeRoles(Role.ADMIN),
//   updateAgent
// );

// // ADMIN: viewing any CareAgent by ID
// router.get(
//   "/:careAgentId", 
//   authMiddleware, 
//   authorizeRoles(Role.ADMIN), 
//   adminGetCareAgent
// );

// // CARE_AGENT: Fetch their own assignments
// router.get(
//   "/me/assignments",
//   authMiddleware,
//   authorizeRoles(Role.CARE_AGENT), 
//   getMyAssignments
// );


router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(Role.ADMIN), // Ensure only Admins can hit this
  deleteCareAssignmment
);

export default router;