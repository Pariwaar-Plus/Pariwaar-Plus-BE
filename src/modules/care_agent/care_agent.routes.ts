import express from "express";
import {
  getAll,
  getMyProfile,
  updateMyProfile,
  adminGetCareAgent,
  getMyAssignments,
  registerCareAgent,
  deleteCareAgent
} from "./care_agent.controller";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client"; // Import the Enum

const router = express.Router();

router.post(
  "/registerCareAgent", 
  authMiddleware,
  authorizeRoles(Role.ADMIN), 
  registerCareAgent
);


// ADMIN: Fetch all agent data for the dashboard
router.get(
  "/",
  authMiddleware,
  authorizeRoles(Role.ADMIN),  
  getAll
);

// CARE_AGENT: Fetch their own professional profile
router.get(
  "/me",
  authMiddleware,
  authorizeRoles(Role.CARE_AGENT), 
  getMyProfile
);

// CARE_AGENT: Update profile details
router.patch( 
  "/me",
  authMiddleware,
  authorizeRoles(Role.CARE_AGENT), 
  updateMyProfile
);

// CARE_AGENT: Fetch their own assignments
router.get(
  "/me/assignments",
  authMiddleware,
  authorizeRoles(Role.CARE_AGENT), 
  getMyAssignments
);

// ADMIN: viewing any CareAgent by ID
router.get(
  "/admin/view/:careAgentId", 
  authMiddleware, 
  authorizeRoles(Role.ADMIN), 
  adminGetCareAgent
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN"), // Ensure only Admins can hit this
  deleteCareAgent
);

export default router;