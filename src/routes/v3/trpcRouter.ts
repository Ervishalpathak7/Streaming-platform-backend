import { router } from "@/trpc/trpc.js";


export const trpcRouter = router({
  // add your routes here
});

export type TrpcRouter = typeof trpcRouter;