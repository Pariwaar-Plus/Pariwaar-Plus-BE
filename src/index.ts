import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import careAgentRoutes from "./modules/care_agent/care_agent.routes";
import familyRoutes from "./modules/family/family.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/care-agent", careAgentRoutes);
rootRouter.use("/family", familyRoutes);

export default rootRouter;