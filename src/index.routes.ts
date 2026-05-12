import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import careAgentRoutes from "./modules/care_agent/care_agent.routes";
import familyRoutes from "./modules/family/family.routes";
import visitLogRoutes from "./modules/home_visit/home_visit.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/care-agent", careAgentRoutes);
rootRouter.use("/family", familyRoutes);
rootRouter.use("/home-visit", visitLogRoutes);

export default rootRouter;