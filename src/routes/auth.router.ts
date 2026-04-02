import express from "express";
import { login } from "../controllers/auth.controller";

const authRouter = express.Router();

authRouter.get("/", (req, res) => {
  res.send("Welcome to the Auth API!");
});

authRouter.post("/login", (req, res) => {
  res.send(login(req,res));
});



export default authRouter;