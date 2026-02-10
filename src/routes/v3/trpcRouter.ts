import { router } from "@/trpc/trpc.js";
import { trpcAuthRouter } from "./auth.routes.js";
import { trpcUserRouter } from "./user.routes.js";


export const trpcRouter = router({
  auth: trpcAuthRouter,
  user : trpcUserRouter
});

export type TrpcRouter = typeof trpcRouter;