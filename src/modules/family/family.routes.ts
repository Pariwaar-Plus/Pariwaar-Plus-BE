import express from "express";
import { createFamily, getMyFamily, addParent, adminGetFamily, assignAgent } from "./family.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  createFamily
);

// --- CLIENT ROUTES ---
// Child abroad viewing their own family
router.get(
  "/my-family", 
  authMiddleware, 
  authorizeRoles(Role.CLIENT), 
  getMyFamily
);

// --- ADMIN ROUTES ---
// Operations team viewing any family by ID
router.get(
  "/admin/view/:clientId", 
  authMiddleware, 
  authorizeRoles(Role.ADMIN), 
  adminGetFamily
);

// Add a parent to a specific client (Admin only)
router.post(
  "/admin/:clientId/add-parent",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  addParent
);

// Assign a care agent to a care receiver (Admin only)
router.post(
  "/admin/assign-agent",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  assignAgent
);


export default router;