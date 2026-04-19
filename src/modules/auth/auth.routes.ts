import express from "express";
import { register, login, refresh, logout } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Welcome to the Auth API!");
});

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// Only a logged-in user should be able to logout
router.post("/logout", authMiddleware, logout);

export default router;