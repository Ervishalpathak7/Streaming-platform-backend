import express from "express";
import authRouter from "./routes/user.js";
import { errorHandler } from "./middlewares/errorHandeling.js";
import videoRouter from "./routes/video.js";

const app = express();
app.set("trust proxy", true);


app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// routes
app.use("/api/auth", authRouter);
app.use("/api/video", videoRouter);

// error handeling middleware
app.use(errorHandler);

export default app;
