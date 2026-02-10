import { router } from "@/trpc/trpc.js";
import { trpcAuthRouter } from "./auth.routes.js";
import { trpcUserRouter } from "./user.routes.js";


export const v3Router = router({
  auth: trpcAuthRouter,
  user : trpcUserRouter
});

export type V3Router = typeof v3Router;