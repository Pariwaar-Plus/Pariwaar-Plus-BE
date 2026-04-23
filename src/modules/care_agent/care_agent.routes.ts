import express from "express";
import {
  getAll,
  getMyProfile,
  updateMyProfile,
  adminGetCareAgent
} from "./care_agent.controller";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client"; // Import the Enum

const router = express.Router();

/**
 * ADMIN: Fetch all agent data for the dashboard
 */
router.get(
  "/",
  authMiddleware,
  authorizeRoles(Role.ADMIN), // Use Enum instead of "ADMIN"
  getAll
);

/**
 * CARE_AGENT: Fetch their own professional profile
 */
router.get(
  "/me",
  authMiddleware,
  authorizeRoles(Role.CARE_AGENT), // Use Enum
  getMyProfile
);

/**
 * CARE_AGENT: Update professional details
 */
router.patch( // Changed from .put to .patch for partial updates
  "/me",
  authMiddleware,
  authorizeRoles(Role.CARE_AGENT), // Use Enum
  updateMyProfile
);

// --- ADMIN ROUTES ---
// Operations team viewing any CareAgent by ID
router.get(
  "/admin/view/:careAgentId", 
  authMiddleware, 
  authorizeRoles(Role.ADMIN), 
  adminGetCareAgent
);

export default router;