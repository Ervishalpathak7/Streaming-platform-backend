import { Router } from "express";
import v1AuthRouter from "./v1/auth.js";
import v1VideoRouter from "./v1/video.js";

const appRouter = Router();

appRouter.use("/auth", v1AuthRouter);
appRouter.use("/videos", v1VideoRouter);

export default appRouter;
