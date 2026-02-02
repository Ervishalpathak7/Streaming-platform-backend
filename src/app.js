import express from "express";
import authRouter from "./routes/user.js";
import { errorHandler } from "./middlewares/errorHandeling.js";
import videoRouter from "./routes/video.js";
import { requestTimer } from "./utils/request-timer.js";
import cors from "cors"


const app = express();
app.set("trust proxy", true);

const allowedOrigins = [
    "https://streamkaro.app",
    "http://localhost:5173",
    "https://www.streamkaro.app",
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],

}));


app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// middlewares
app.use(requestTimer);

// routes
app.get("/health", (req, res) => { res.status(200).json({ status: "ok" }) });
app.use("/api/auth", authRouter);
app.use("/api/video", videoRouter);

// error handeling middleware
app.use(errorHandler);

export default app;
