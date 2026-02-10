import { v3Router } from "./v3/v3router.js";

export const trpcRouter = {
  v3 : v3Router
};

export type trpcRouter = typeof trpcRouter;