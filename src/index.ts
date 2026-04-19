import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";

const rootRouter = Router();

// Define the path prefixes for each module
rootRouter.use("/auth", authRoutes);

export default rootRouter;