import { Router } from "express";
import { v3Router } from "./v3/v3router.js";
import v1AuthRouter from "./v1/auth.js";


export const appRouter = Router();

appRouter.use("/auth", v1AuthRouter);


export const trpcRouter = {
  v3 : v3Router
};

export type trpcRouter = typeof trpcRouter;