import express from "express";
import { registerCareAgent, login, refresh, logout, getMe, changePassword } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client"; // Import the Enum


const router = express.Router();

router.get("/", (req, res) => {
    res.send("Welcome to the Auth API!");
});

router.post("/register", authMiddleware, authorizeRoles(Role.ADMIN), registerCareAgent);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, getMe);

router.post(
  "/change-password",
  authMiddleware,
  changePassword
);

// Only a logged-in user should be able to logout
router.post("/logout", authMiddleware, logout);

export default router;