import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import careAgentRoutes from "./modules/care_agent/care_agent.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/care-agent", careAgentRoutes);

export default rootRouter;