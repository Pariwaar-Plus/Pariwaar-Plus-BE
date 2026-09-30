import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { createVideoCall, joinVideoCall } from "./video-call-controller";

const router = Router();
router.use(authMiddleware)

//this route can be taken to another required module
router.post(
    "/",
    createVideoCall
);

router.get("/join/:roomId", joinVideoCall)
export default router;