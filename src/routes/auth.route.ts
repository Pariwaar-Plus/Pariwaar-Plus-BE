import express from "express";
import { login } from "../controllers/auth.controller";

const authRouter = express.Router();

const authController = require("../controllers/auth.controller");

authRouter.get("/", (req, res) => {
  res.send("Welcome to the Auth API!");
});

authRouter.post("/staffRegister", authController.staffRegister)

authRouter.post("/login", authController.login);


export default authRouter;