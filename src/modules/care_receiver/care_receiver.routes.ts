import express from "express";
import {
  createCareReceiver,
  getAll,
  getCareReceiver,
  updateCareReceiver,
  deleteCareReceiver,
} from "./care_receiver.controller";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client"; // Import the Enum

const router = express.Router();

// ADMIN: Create a new care receiver
router.post(
  "/",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  createCareReceiver
);

// ADMIN: Fetch all care receivers for the dashboard
router.get(
  "/",
  authMiddleware,
  getAll
);

// ADMIN: View a single care receiver by ID (includes assigned care agent)
router.get(
  "/:careReceiverId",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  getCareReceiver
);

// ADMIN: Update care receiver details
router.patch(
  "/:careReceiverId",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  updateCareReceiver
);

// ADMIN: Soft delete a care receiver
router.delete(
  "/:careReceiverId",
  authMiddleware,
  authorizeRoles(Role.ADMIN),
  deleteCareReceiver
);

export default router;
