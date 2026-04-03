import express from "express";
import { staffRegister } from "../controllers/auth.controller";

const authRouter = express.Router();

authRouter.get("/", (req, res) => {
  res.send("Welcome to the Auth API!");
});

authRouter.post("/staffRegister", staffRegister)

// authRouter.post("/login", login);


export default authRouter;