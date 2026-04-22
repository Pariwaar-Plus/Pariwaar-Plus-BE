import express from "express";
import { createFamily } from "./family.controller";
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

export default router;