import express from "express";
import authRouter from "./routes/user.js";
import { errorHandler } from "./middlewares/errorHandeling.js";
import videoRouter from "./routes/video.js";
import { requestTimer } from "./utils/request-timer.js";

const app = express();
app.set("trust proxy", true);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// middlewares
app.use(requestTimer);

// routes
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api/auth", authRouter);
app.use("/api/video", videoRouter);

// error handeling middleware
app.use(errorHandler);

export default app;
