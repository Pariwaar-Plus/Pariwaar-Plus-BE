import express from "express";
import authRouter from "./auth.router";
import authenticationMiddleware from "../middlewares/authentication.middleware";
import testRouter from "./test.router";

const router = express.Router();

router.use("/auth", authRouter);
// router.use(authenticationMiddleware)
router.use("/test", testRouter);

export default router;