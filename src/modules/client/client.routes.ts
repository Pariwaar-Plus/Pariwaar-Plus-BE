import { Router } from "express";
import * as controller from "./client.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/* ─────────────────────────────────────────────
  Admin routes
───────────────────────────────────────────── */

// POST   /clients          — register new client
router.post(
  "/",
  authorizeRoles("ADMIN"),
  controller.registerClient
);

// GET    /clients          — list all clients
router.get(
  "/",
  authorizeRoles("ADMIN"),
  controller.getAllClients
);

// GET    /clients/:clientId  — get single client profile
router.get(
  "/:clientId",
  authorizeRoles("ADMIN"),
  controller.getClientById
);

// PATCH  /clients/:clientId  — update client
router.patch(
  "/:clientId",
  authorizeRoles("ADMIN"),
  controller.updateClient
);

// DELETE /clients/:clientId  — soft delete client
router.delete(
  "/:clientId",
  authorizeRoles("ADMIN"),
  controller.deleteClient
);

/* ─────────────────────────────────────────────
  Client's own routes
───────────────────────────────────────────── */

// GET /clients/me — client views their own profile
router.get(
  "/me",
  authorizeRoles("CLIENT"),
  controller.getMyProfile
);

export default router;