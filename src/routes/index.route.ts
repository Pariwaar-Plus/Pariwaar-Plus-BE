import express from "express";
import authRouter from "./auth.router";

const router = express.Router();

router.use("/auth", authRouter);
//list others routes here

export default router;