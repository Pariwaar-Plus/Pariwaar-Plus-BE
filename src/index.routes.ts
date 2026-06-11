import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import careAgentRoutes from "./modules/care_agent/care_agent.routes";
import careReceiverRoutes from "./modules/care_receiver/care_receiver.routes";
import clientRoutes from "./modules/client/client.routes";
import visitLogRoutes from "./modules/home_visit/home_visit.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/care-agent", careAgentRoutes);
rootRouter.use("/care-receiver", careReceiverRoutes);
rootRouter.use("/client", clientRoutes);
rootRouter.use("/home-visit", visitLogRoutes);

export default rootRouter;