import express from "express";
import { login, refresh, logout, getMe, changePassword, forgotPassword, validateResetPasswordToken } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";


const router = express.Router();

router.get("/", (req, res) => {
    res.send("Welcome to the Auth API!");
});

router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, getMe);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password/validate",
  validateResetPasswordToken
);

router.post(
  "/reset-password",
  changePassword
);

// Only a logged-in user should be able to logout
router.post("/logout", authMiddleware, logout);

export default router;