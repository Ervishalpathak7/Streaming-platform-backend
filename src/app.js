import express from "express";
import { configDotenv } from "dotenv";
import { authMiddleware } from "./middlewares/auth.js";
import fileRouter from "./routes/video.js";
import userRouter from "./routes/user.js";
import { errorHandler } from "./middlewares/errorHandeling.js";
import { asyncHandler } from "./utils/asyncHandler.js";

configDotenv();
const app = express();

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// routes
app.use("/api/auth", userRouter);
app.use("/api/video", fileRouter);

// error handeling middleware
app.use(errorHandler);

export default app;
