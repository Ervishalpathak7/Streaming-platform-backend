import z from "zod";

export const meResSchema = z.object({
  message: z.string(),
  status: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  }),
});
